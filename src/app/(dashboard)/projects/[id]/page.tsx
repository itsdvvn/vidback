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
  updateProjectThumbnail,
} from "@/lib/actions";
import { authClient } from "@/lib/auth-client";
import { useVideoPlayerActions } from "@/components/video/VideoPlayerProvider";
import { ToastProvider, toast } from "@/components/ui/Toast";
import { StatusSelector } from "@/components/dashboard/StatusSelector";
import { captureVideoFrame } from "@/lib/thumbnail";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [status, setStatus] = useState<string>("Under Review");
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">(
    "loading",
  );
  const [error, setError] = useState("");
  const router = useRouter();

  const [editorName, setEditorName] = useState("");
  const prevCommentCountRef = useRef(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (loadState !== "ready") return;
    pollingRef.current = setInterval(async () => {
      try {
        const commentData = await getProjectComments(projectId);
        const newComments = commentData as Comment[];
        if (newComments.length > prevCommentCountRef.current) {
          toast("New feedback arrived!");
        }
        prevCommentCountRef.current = newComments.length;
        setComments(newComments);
      } catch {
        /* ignore */
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
        /* ignore */
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
        /* ignore */
      }
    },
    [projectId],
  );

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    try {
      await updateProjectStatus(projectId, newStatus);
    } catch {
      /* ignore */
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

  if (loadState === "loading") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="aspect-video w-full rounded-xl mb-4" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <h2 className="text-lg font-semibold mb-2">Failed to load project</h2>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
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
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg p-2 text-muted-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {project?.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <StatusSelector
                  current={status as any}
                  onChange={handleStatusChange}
                />
                <p className="text-sm text-muted-foreground">
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
          {showDeleteConfirm && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/50"
                onClick={() => !deleting && setShowDeleteConfirm(false)}
              />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
                  <h3 className="text-lg font-semibold text-foreground">
                    Delete project?
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This action cannot be undone. All comments and data
                    associated with this project will be permanently removed.
                  </p>
                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

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

  // Auto-capture thumbnail on the client side using captureVideoFrame
  useEffect(() => {
    if (!project?.videoUrl || project.thumbnailUrl) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const blob = await captureVideoFrame(project.videoUrl, 5);

        // Convert blob to base64
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        if (cancelled) return;

        // Upload to R2 via the thumbnail upload API
        const res = await fetch("/api/thumbnail/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: project.id,
            imageBase64: base64,
          }),
        });

        if (cancelled || !res.ok) return;
        const { thumbnailUrl } = await res.json();
        if (!cancelled) {
          await updateProjectThumbnail(project.id, thumbnailUrl);
        }
      } catch {
        /* ignore client-side capture errors */
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [project?.videoUrl, project?.thumbnailUrl, project?.id]);

  return (
    <div className="space-y-6">
      <VideoPlayer
        src={project?.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4"}
        showCommentButton={false}
        comments={comments}
      />
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-semibold text-sm text-foreground">
            Client Feedback ({comments.length})
          </h2>
          <span className="text-xs text-muted-foreground/70">
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
