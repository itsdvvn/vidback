"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Comment } from "@/types";
import { VideoPlayerProvider } from "@/components/video/VideoPlayerProvider";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { CommentList } from "@/components/comments/CommentList";
import { CommentInput } from "@/components/comments/CommentInput";
import { ShareLinkCopy } from "@/components/dashboard/ShareLinkCopy";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ArrowLeft } from "lucide-react";

const MOCK_PROJECT = {
  id: "1",
  name: "Client Edit v3 — Final Cut",
  videoUrl:
    "https://drive.google.com/uc?export=download&id=1T8W0ytVrMe3DpXGtDb7Yii0XalX0wAFa",
  shareToken: "sh72-91sa-k182",
  editorId: "editor-1",
};

const MOCK_COMMENTS: Comment[] = [
  {
    id: 1, projectId: "1", authorName: "Sarah (Client)",
    content: "Can we speed up this transition? It feels a little slow.",
    timestamp: 5.2, isResolved: null, parentId: null,
    createdAt: new Date("2025-05-09"),
    replies: [
      { id: 4, projectId: "1", authorName: "Editor Mike", content: "Good catch — I'll tighten that up to 0.5s.", timestamp: 5.2, isResolved: null, parentId: 1, createdAt: new Date("2025-05-10") },
    ],
  },
  {
    id: 2, projectId: "1", authorName: "Sarah (Client)",
    content: "The background music is too loud here.",
    timestamp: 15.8, isResolved: new Date("2025-05-10"), parentId: null,
    createdAt: new Date("2025-05-09"), replies: [],
  },
  {
    id: 3, projectId: "1", authorName: "Sarah (Client)",
    content: "Love this shot! Keep it exactly as is.",
    timestamp: 22.0, isResolved: null, parentId: null,
    createdAt: new Date("2025-05-09"), replies: [],
  },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const status = comments.length === 0 ? "empty" : "success";
  const unresolvedCount = comments.filter(
    (c) => c.isResolved === null && c.parentId === null,
  ).length;

  const handleAddComment = useCallback(
    (data: { authorName: string; content: string; timestamp: number; parentId?: number }) => {
      const optimistic: Comment = {
        id: Date.now(), projectId, authorName: data.authorName,
        content: data.content, timestamp: data.timestamp,
        isResolved: null, parentId: data.parentId ?? null,
        createdAt: new Date(), replies: [],
      };
      setComments((prev) => {
        if (data.parentId) {
          return prev.map((c) =>
            c.id === data.parentId
              ? { ...c, replies: [...(c.replies ?? []), optimistic] }
              : c,
          );
        }
        return [...prev, optimistic];
      });
    },
    [projectId],
  );

  const handleResolve = useCallback((commentId: number, resolved: boolean) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) return { ...c, isResolved: resolved ? new Date() : null };
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === commentId ? { ...r, isResolved: resolved ? new Date() : null } : r,
            ),
          };
        }
        return c;
      }),
    );
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="rounded-lg p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{MOCK_PROJECT.name}</h1>
            <p className="text-sm text-zinc-500">{unresolvedCount} unresolved, {comments.length} total</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ShareLinkCopy shareToken={MOCK_PROJECT.shareToken} />
          <ThemeToggle />
        </div>
      </div>

      {/* Single column: Video → Controls → Comment Input → Comment List */}
      <div className="space-y-4">
        <VideoPlayerProvider>
          <VideoPlayer src={MOCK_PROJECT.videoUrl} showCommentButton={false} />

          {/* Comment Input — directly below player controls */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Add a Reply</h2>
            <CommentInput onSubmit={handleAddComment} forceVisible />
          </div>

          {/* Comment History */}
          <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <h2 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Comment History ({comments.length})</h2>
            </div>
            <CommentList
              comments={comments} status={status as "loading" | "empty" | "error" | "success"}
              onReply={(parentId, data) => handleAddComment({ ...data, parentId })}
              onResolve={handleResolve} isEditor
            />
          </div>
        </VideoPlayerProvider>
      </div>
    </div>
  );
}
