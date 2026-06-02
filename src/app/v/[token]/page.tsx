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
import { Film, AlertCircle, RefreshCw, KeyRound } from "lucide-react";
import { createComment } from "@/lib/actions";
import { useVideoPlayerActions } from "@/components/video/VideoPlayerProvider";
import {
  ClientIdentityModal,
  getCurrentClient,
} from "@/components/comments/ClientIdentityModal";

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
  const [clientName, setClientName] = useState("");
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verifying, setVerifying] = useState(false);

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

  // ─── Password verification ───
  useEffect(() => {
    try {
      const verified = sessionStorage.getItem(`viback-pwd-${token}`);
      if (verified === "true") {
        setPasswordVerified(true);
      }
    } catch {
      // ignore
    }
  }, [token]);

  const handlePasswordSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setVerifying(true);
      setPasswordError("");

      try {
        const res = await fetch("/api/v/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shareToken: token, password: passwordInput }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.valid) {
            try {
              sessionStorage.setItem(`viback-pwd-${token}`, "true");
            } catch {
              // ignore
            }
            setPasswordVerified(true);
          } else {
            setPasswordError("Incorrect password. Please try again.");
          }
        } else {
          setPasswordError("Failed to verify password.");
        }
      } catch {
        setPasswordError("Network error. Please try again.");
      } finally {
        setVerifying(false);
      }
    },
    [token, passwordInput],
  );

  // ─── Client identity ───
  useEffect(() => {
    // Check if client is already identified this session
    const existing = getCurrentClient();
    if (existing) {
      setClientName(existing);
    } else {
      setShowIdentityModal(true);
    }
  }, []);

  const handleIdentityComplete = useCallback((name: string) => {
    setClientName(name);
    setShowIdentityModal(false);
  }, []);

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
          // Track new comment count silently
          if (newComments.length > prevCommentCountRef.current) {
            prevCommentCountRef.current = newComments.length;
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
      annotations?: string;
    }) => {
      const optimistic: Comment = {
        id: Date.now(),
        projectId: project?.id || "",
        authorName: data.authorName,
        content: data.content,
        timestamp: data.timestamp,
        isResolved: null,
        parentId: null,
        annotations: data.annotations ? JSON.parse(data.annotations) : [],
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
        if (data.annotations) {
          formData.set("annotations", data.annotations);
        }
        await createComment(formData);
      } catch {
        // Rollback on error — refetch from server
        await fetchData();
      }
    },
    [project?.id, addOptimisticComment, fetchData],
  );

  // ─── Reply handler (optimistic + server) ───
  const handleReply = useCallback(
    async (
      parentId: number,
      data: {
        authorName: string;
        content: string;
        timestamp: number;
        annotations?: string;
      },
    ) => {
      const optimistic: Comment = {
        id: Date.now(),
        projectId: project?.id || "",
        authorName: data.authorName,
        content: data.content,
        parentId,
        timestamp: 0,
        isResolved: null,
        annotations: data.annotations ? JSON.parse(data.annotations) : [],
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
        formData.set("timestamp", "0");
        formData.set("parentId", String(parentId));
        if (data.annotations) {
          formData.set("annotations", data.annotations);
        }
        await createComment(formData);
      } catch {
        // Rollback on error — refetch from server
        await fetchData();
      }
    },
    [project?.id, addOptimisticComment, fetchData],
  );

  // ─── Password gate ───
  if (!passwordVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-center text-lg font-semibold text-foreground">
              Password Required
            </h1>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Enter the password provided by your editor to access this project.
            </p>
            <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
              <div>
                <input
                  id="review-password"
                  type="password"
                  placeholder="Enter password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  autoFocus
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {passwordError && (
                  <p className="mt-1.5 text-sm text-red-600">{passwordError}</p>
                )}
              </div>
              <Button type="submit" className="w-full" loading={verifying}>
                <KeyRound className="h-4 w-4" />
                Access Review
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ─── Loading ───
  if (loadState === "loading") {
    return (
      <div className="min-h-screen bg-background">
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {error === "Project not found"
                ? "Project Not Found"
                : "Failed to Load"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
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
    <div className="min-h-screen bg-background text-foreground">
      <VideoPlayerProvider>
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <Film className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-sm font-semibold">{project?.name}</h1>
              <p className="text-xs text-muted-foreground/70">
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
          onReply={handleReply}
          clientName={clientName}
        />

        <footer className="flex flex-wrap items-center justify-center gap-3 py-4 px-4 text-xs text-muted-foreground/70 border-t border-border">
          <span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-muted-foreground">
              Space
            </kbd>{" "}
            Play/Pause
          </span>
          <span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-muted-foreground">
              J
            </kbd>{" "}
            Rewind 10s
          </span>
          <span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-muted-foreground">
              K
            </kbd>{" "}
            Pause
          </span>
          <span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-muted-foreground">
              L
            </kbd>{" "}
            Forward 10s
          </span>
          <span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-muted-foreground">
              C
            </kbd>{" "}
            Add Comment
          </span>
        </footer>
      </VideoPlayerProvider>
      {showIdentityModal && (
        <ClientIdentityModal onComplete={handleIdentityComplete} />
      )}
    </div>
  );
}

/** Inner component rendered inside VideoPlayerProvider so it can access seek */
function ReviewVideoSection({
  project,
  comments,
  status,
  onAddComment,
  onReply,
  clientName,
}: {
  project: any;
  comments: Comment[];
  status: "loading" | "empty" | "error" | "success";
  onAddComment: (data: {
    authorName: string;
    content: string;
    timestamp: number;
    annotations?: string;
  }) => Promise<void>;
  onReply?: (
    parentId: number,
    data: {
      authorName: string;
      content: string;
      timestamp: number;
      annotations?: string;
    },
  ) => Promise<void>;
  clientName: string;
}) {
  const { seek } = useVideoPlayerActions();
  const handleSeekToComment = useCallback(
    (timestamp: number) => {
      seek(timestamp);
    },
    [seek],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Video only (left, sticky on desktop) */}
        <div className="md:flex-[2] min-w-0 md:sticky md:top-24 md:self-start">
          <VideoPlayer
            src={
              project?.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4"
            }
            comments={comments}
          />
        </div>

        {/* Comment input + list (right) */}
        <div className="md:flex-1 md:sticky md:top-24 md:self-start flex flex-col gap-3">
          {/* Input stays at the top, always visible */}
          <CommentInput
            onSubmit={onAddComment}
            defaultName={clientName || undefined}
            forceVisible
          />
          {/* Comments scroll independently below */}
          <div className="md:max-h-[calc(100vh-16rem)] md:overflow-y-auto rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="font-semibold text-sm">
                Comments ({comments.length})
              </h2>
            </div>
            <CommentList
              comments={comments}
              status={status}
              onSeek={handleSeekToComment}
              onReply={onReply}
              editorName={clientName || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
