"use client";

import { useState, useCallback, use } from "react";
import type { Comment } from "@/types";
import { VideoPlayerProvider } from "@/components/video/VideoPlayerProvider";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { CommentList } from "@/components/comments/CommentList";
import { CommentInput } from "@/components/comments/CommentInput";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Film } from "lucide-react";

const MOCK_PROJECT = {
  id: "1",
  name: "Client Edit v3 — Final Cut",
  videoUrl:
    "https://drive.google.com/uc?export=download&id=1T8W0ytVrMe3DpXGtDb7Yii0XalX0wAFa",
  shareToken: "sh72-91sa-k182",
};

const MOCK_COMMENTS: Comment[] = [
  { id: 1, projectId: "1", authorName: "Sarah (Client)", content: "Can we speed up this transition? It feels a little slow.", timestamp: 5.2, isResolved: null, parentId: null, createdAt: new Date("2025-05-09"), replies: [] },
  { id: 2, projectId: "1", authorName: "Mark (Reviewer)", content: "The background music is too loud here.", timestamp: 15.8, isResolved: null, parentId: null, createdAt: new Date("2025-05-09"), replies: [] },
  { id: 3, projectId: "1", authorName: "Sarah (Client)", content: "Love this shot! Keep it exactly as is.", timestamp: 22.0, isResolved: null, parentId: null, createdAt: new Date("2025-05-09"), replies: [] },
];

export default function ClientReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const status = comments.length === 0 ? "empty" : "success";

  const handleAddComment = useCallback(
    (data: { authorName: string; content: string; timestamp: number }) => {
      const optimistic: Comment = {
        id: Date.now(), projectId: MOCK_PROJECT.id,
        authorName: data.authorName, content: data.content,
        timestamp: data.timestamp, isResolved: null, parentId: null,
        createdAt: new Date(), replies: [],
      };
      setComments((prev) => [...prev, optimistic]);
    }, []);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-white">
      <VideoPlayerProvider>
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <Film className="h-5 w-5 text-indigo-500" />
            <div>
              <h1 className="text-sm font-semibold">{MOCK_PROJECT.name}</h1>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Leave time-coded feedback — no login required.</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        {/* Single column layout */}
        <div className="mx-auto max-w-5xl px-4 py-4 space-y-4">
          <VideoPlayer src={MOCK_PROJECT.videoUrl} showCommentButton />
          <CommentInput onSubmit={handleAddComment} />

          <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <h2 className="font-semibold text-sm">Comment History ({comments.length})</h2>
            </div>
            <CommentList comments={comments} status={status as "loading" | "empty" | "error" | "success"} />
          </div>
        </div>

        {/* Keyboard shortcuts footer */}
        <footer className="flex items-center justify-center gap-6 py-4 text-xs text-zinc-400 dark:text-zinc-500 border-t border-zinc-200 dark:border-zinc-800">
          <span><kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">Space</kbd> Play/Pause</span>
          <span><kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">J</kbd> Rewind 10s</span>
          <span><kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">K</kbd> Pause</span>
          <span><kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">L</kbd> Forward 10s</span>
          <span><kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">C</kbd> Add Comment</span>
        </footer>
      </VideoPlayerProvider>
    </div>
  );
}
