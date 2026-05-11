"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Comment } from "@/types";
import { VideoPlayerProvider } from "@/components/video/VideoPlayerProvider";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { CommentList } from "@/components/comments/CommentList";
import { ShareLinkCopy } from "@/components/dashboard/ShareLinkCopy";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, AlertCircle, RefreshCw, Trash2 } from "lucide-react";
import {
  getProjectWithCounts,
  getProjectComments,
  toggleResolve,
  replyToComment,
  updateProjectStatus,
  deleteProject,
} from "@/lib/actions";
import { authClient } from "@/lib/auth-client";
import { useVideoPlayerActions } from "@/components/video/VideoPlayerProvider";
import { ToastProvider, toast } from "@/components/ui/Toast";

const PROJECT_STATUSES = [
  "Under Review",
  "In Progress",
  "Approved",
  "Needs Revision",
] as const;
type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [status, setStatus] = useState<ProjectStatus>("Under Review");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">(
    "loading",
  );
  const [error, setError] = useState("");
  const router = useRouter();

  const [editorName, setEditorName] = useState("");

  // Track previous comment count to detect new comments during polling
  const prevCommentCountRef = useRef(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch the editor's display name from the session
  useEffect(() => {
    authClient
      .getSession()
      .then(({ data }) => {
        if (data?.user?.name) setEditorName(data.user.name);
      })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoadState("loading");
    setError("");
    try {
      const [projectData, commentData] = await Promise.all([
        getProjectWithCounts(projectId),
        getProjectComments(projectId),
      ]);
      setProject(projectData);
      setStatus((projectData as any).status || "Under Review");
      const fetchedComments = commentData as Comment[];
      setComments(fetchedComments);
      prevCommentCountRef.current = fetchedComments.length;
      setLoadState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
      setLoadState("error");
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Polling for real-time comment updates ───
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (loadState !== "ready") return;

    pollingRef.current = setInterval(async () => {
      try {
        const commentData = await getProjectComments(projectId);
        const newComments = commentData as Comment[];
        // Show info toast when new comments are detected
        if (newComments.length > prevCommentCountRef.current) {
          toast("New feedback arrived!");
        }
        prevCommentCountRef.current = newComments.length;
        setComments(newComments);
      } catch {
        // silent — don't disrupt the editor
      }
    }, 10_000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [projectId, loadState]);

  const unresolvedCount = comments.filter(
    (c) => c.isResolved === null && c.parentId === null,
  ).length;
  const commentStatus = comments.length === 0 ? "empty" : "success";

  const handleResolve = useCallback(
    async (commentId: number, resolved: boolean) => {
      try {
        await toggleResolve(commentId, resolved);
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId)
              return { ...c, isResolved: resolved ? new Date() : null };
            if (c.replies) {
              return {
                ...c,
                replies: c.replies.map((r) =>
                  r.id === commentId
                    ? { ...r, isResolved: resolved ? new Date() : null }
                    : r,
                ),
              };
            }
            return c;
          }),
        );
      } catch {
        // ignore
      }
    },
    [],
  );

  const handleReply = useCallback(
    async (
      parentId: number,
      data: { authorName: string; content: string; timestamp: number },
    ) => {
      try {
        const reply = await replyToComment(parentId, projectId, data.content);
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: [...(c.replies || []), reply] }
              : c,
          ),
        );
        toast("Reply submitted!", "success");
      } catch {
        // ignore
      }
    },
    [projectId],
  );

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus as ProjectStatus);
    setShowStatusMenu(false);
    try {
      await updateProjectStatus(projectId, newStatus);
    } catch {
      // ignore
    }
  };

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await deleteProject(projectId);
      router.push("/dashboard");
    } catch {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [projectId, router]);

  // ─── Loading ───
  if (loadState === "loading") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="aspect-video w-full rounded-xl mb-4" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  // ─── Error ───
  if (loadState === "error") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <h2 className="text-lg font-semibold mb-2">Failed to load project</h2>
          <p className="text-sm text-zinc-500 mb-4">{error}</p>
          <Button onClick={fetchData}>
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Top bar */}
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                {project?.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {/* Status dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                    className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
                  >
                    {status}
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {showStatusMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowStatusMenu(false)}
                      />
                      <div className="absolute top-full left-0 mt-1 z-20 w-40 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                        {PROJECT_STATUSES.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(s)}
                            className={`block w-full px-3 py-1.5 text-left text-sm transition-colors ${
                              s === status
                                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                                : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <p className="text-sm text-zinc-500">
                  {unresolvedCount} unresolved, {comments.length} total
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {project && <ShareLinkCopy shareToken={project.shareToken} />}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              title="Delete project"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <ThemeToggle />
          </div>

          {/* Delete confirmation dialog */}
          {showDeleteConfirm && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/50"
                onClick={() => !deleting && setShowDeleteConfirm(false)}
              />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    Delete project?
                  </h3>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    This action cannot be undone. All comments and data
                    associated with this project will be permanently removed.
                  </p>
                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                      className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors disabled:pointer-events-none disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:pointer-events-none disabled:opacity-50"
                    >
                      {deleting && (
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      )}
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Video + Comment panel */}
        <VideoPlayerProvider>
          <ProjectVideoSection
            project={project}
            comments={comments}
            commentStatus={commentStatus}
            onResolve={handleResolve}
            onReply={handleReply}
            editorName={editorName}
          />
        </VideoPlayerProvider>
      </div>
    </ToastProvider>
  );
}

/** Inner component rendered inside VideoPlayerProvider so it can access seek */
function ProjectVideoSection({
  project,
  comments,
  commentStatus,
  onResolve,
  onReply,
  editorName,
}: {
  project: any;
  comments: Comment[];
  commentStatus: string;
  onResolve: (commentId: number, resolved: boolean) => void;
  onReply: (
    parentId: number,
    data: { authorName: string; content: string; timestamp: number },
  ) => void;
  editorName: string;
}) {
  const { seek } = useVideoPlayerActions();
  const handleSeekToComment = useCallback(
    (timestamp: number) => {
      seek(timestamp);
    },
    [seek],
  );

  return (
    <div className="space-y-6">
      <VideoPlayer
        src={project?.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4"}
        showCommentButton={false}
        comments={comments}
      />

      {/* Comment history */}
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
            Client Feedback ({comments.length})
          </h2>
          <span className="text-xs text-zinc-400">
            Synced — all changes appear for the client
          </span>
        </div>
        <CommentList
          comments={comments}
          status={commentStatus as "loading" | "empty" | "error" | "success"}
          onResolve={onResolve}
          onReply={onReply}
          onSeek={handleSeekToComment}
          isEditor
          editorName={editorName}
        />
      </div>
    </div>
  );
}
