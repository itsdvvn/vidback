"use client";

import {
  useState,
  useCallback,
  useEffect,
  use,
  useOptimistic,
  useRef,
  startTransition,
} from "react";
import type { Comment } from "@/types";
import { VideoPlayerProvider } from "@/components/video/VideoPlayerProvider";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { CommentList } from "@/components/comments/CommentList";
import { CommentInput } from "@/components/comments/CommentInput";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Film, AlertCircle, RefreshCw } from "lucide-react";
import { createComment } from "@/lib/actions";
import { useVideoPlayerActions } from "@/components/video/VideoPlayerProvider";
import { ToastProvider, toast } from "@/components/ui/Toast";

/** Poll for new comments every N ms */
const POLL_INTERVAL = 10_000;

export default function ClientReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [project, setProject] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">(
    "loading",
  );
  const [error, setError] = useState("");

  // Track previous comment count to detect new comments during polling
  const prevCommentCountRef = useRef(0);

  // ─── Optimistic updates ───
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state, newComment: Comment) => [...state, newComment],
  );

  // ─── Data fetching ───
  const fetchData = useCallback(async () => {
    setLoadState("loading");
    setError("");
    try {
      const res = await fetch(`/api/public/projects/${token}`);
      if (!res.ok)
        throw new Error(
          res.status === 404 ? "Project not found" : "Failed to load",
        );
      const data = await res.json();
      setProject(data.project);
      setComments(data.comments as Comment[]);
      prevCommentCountRef.current = (data.comments as Comment[]).length;
      setLoadState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
      setLoadState("error");
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Polling for cross-tab / multi-device sync ───
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (loadState !== "ready") return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/public/projects/${token}`);
        if (res.ok) {
          const data = await res.json();
          const newComments = data.comments as Comment[];
          // Show info toast when new comments are detected
          if (newComments.length > prevCommentCountRef.current) {
            toast("New feedback arrived!");
          }
          prevCommentCountRef.current = newComments.length;
          setComments(newComments);
        }
      } catch {
        // silent — don't disrupt the user
      }
    }, POLL_INTERVAL);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [token, loadState]);

  const status = comments.length === 0 ? "empty" : "success";

  // ─── Add comment handler (optimistic + server) ───
  const handleAddComment = useCallback(
    async (data: {
      authorName: string;
      content: string;
      timestamp: number;
    }) => {
      const optimistic: Comment = {
        id: Date.now(),
        projectId: project?.id || "",
        authorName: data.authorName,
        content: data.content,
        timestamp: data.timestamp,
        isResolved: null,
        parentId: null,
        createdAt: new Date(),
        replies: [],
      };

      startTransition(() => {
        addOptimisticComment(optimistic);
      });

      try {
        const formData = new FormData();
        formData.set("projectId", project?.id || "");
        formData.set("authorName", data.authorName);
        formData.set("content", data.content);
        formData.set("timestamp", String(data.timestamp));
        await createComment(formData);
        toast("Comment added! ✓", "success");
      } catch {
        // Rollback on error — refetch from server
        await fetchData();
      }
    },
    [project?.id, addOptimisticComment, fetchData],
  );

  // ─── Loading ───
  if (loadState === "loading") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-5xl px-4 py-4 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // ─── Error ───
  if (loadState === "error") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {error === "Project not found"
                ? "Project Not Found"
                : "Failed to Load"}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {error === "Project not found"
                ? "This link may be invalid or the project has been deleted."
                : error}
            </p>
          </div>
          <Button onClick={fetchData} variant="secondary">
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-white">
        <VideoPlayerProvider>
          <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-3">
              <Film className="h-5 w-5 text-indigo-500" />
              <div>
                <h1 className="text-sm font-semibold">{project?.name}</h1>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Leave time-coded feedback — no login required.
                </p>
              </div>
            </div>
            <ThemeToggle />
          </header>

          <ReviewVideoSection
            project={project}
            comments={optimisticComments}
            status={status as "loading" | "empty" | "error" | "success"}
            onAddComment={handleAddComment}
          />

          <footer className="flex items-center justify-center gap-6 py-4 text-xs text-zinc-400 dark:text-zinc-500 border-t border-zinc-200 dark:border-zinc-800">
            <span>
              <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                Space
              </kbd>{" "}
              Play/Pause
            </span>
            <span>
              <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                J
              </kbd>{" "}
              Rewind 10s
            </span>
            <span>
              <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                K
              </kbd>{" "}
              Pause
            </span>
            <span>
              <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                L
              </kbd>{" "}
              Forward 10s
            </span>
            <span>
              <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                C
              </kbd>{" "}
              Add Comment
            </span>
          </footer>
        </VideoPlayerProvider>
      </div>
    </ToastProvider>
  );
}

/** Inner component rendered inside VideoPlayerProvider so it can access seek */
function ReviewVideoSection({
  project,
  comments,
  status,
  onAddComment,
}: {
  project: any;
  comments: Comment[];
  status: "loading" | "empty" | "error" | "success";
  onAddComment: (data: {
    authorName: string;
    content: string;
    timestamp: number;
  }) => Promise<void>;
}) {
  const { seek } = useVideoPlayerActions();
  const handleSeekToComment = useCallback(
    (timestamp: number) => {
      seek(timestamp);
    },
    [seek],
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 space-y-4">
      <VideoPlayer
        src={project?.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4"}
        showCommentButton
        comments={comments}
      />
      <CommentInput onSubmit={onAddComment} />

      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="font-semibold text-sm">
            Comments ({comments.length})
          </h2>
        </div>
        <CommentList
          comments={comments}
          status={status}
          onSeek={handleSeekToComment}
        />
      </div>
    </div>
  );
}
