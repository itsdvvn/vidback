"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Comment } from "@/types";
import { VideoPlayerProvider } from "@/components/video/VideoPlayerProvider";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { CommentList } from "@/components/comments/CommentList";
import { CommentThread } from "@/components/comments/CommentThread";
import { ShareLinkCopy } from "@/components/dashboard/ShareLinkCopy";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ArrowLeft } from "lucide-react";
import { commentStore } from "@/lib/store";

const PROJECT_STATUSES = ["Under Review", "In Progress", "Approved", "Needs Revision"] as const;
type ProjectStatus = (typeof PROJECT_STATUSES)[number];

const MOCK_PROJECT = {
  id: "1",
  name: "Client Edit v3 — Final Cut",
  videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
  shareToken: "sh72-91sa-k182",
  editorId: "editor-1",
};

export default function ProjectDetailPage() {
  const params = useParams();

  const [comments, setComments] = useState<Comment[]>(() => commentStore.getAll());
  const [status, setStatus] = useState<ProjectStatus>("Under Review");
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Subscribe to the shared store — any change from client or editor re-renders both
  useEffect(() => {
    const unsub = commentStore.subscribe(() => {
      setComments([...commentStore.getAll()]);
    });
    return unsub;
  }, []);

  const unresolvedCount = comments.filter(
    (c) => c.isResolved === null && c.parentId === null,
  ).length;
  const commentStatus = comments.length === 0 ? "empty" : "success";

  const handleResolve = useCallback((commentId: number, resolved: boolean) => {
    commentStore.resolve(commentId, resolved);
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
            <div className="flex items-center gap-2 mt-1">
              {/* Status dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
                >
                  {status}
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showStatusMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
                    <div className="absolute top-full left-0 mt-1 z-20 w-40 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                      {PROJECT_STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => { setStatus(s); setShowStatusMenu(false); }}
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
              <p className="text-sm text-zinc-500">{unresolvedCount} unresolved, {comments.length} total</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ShareLinkCopy shareToken={MOCK_PROJECT.shareToken} />
          <ThemeToggle />
        </div>
      </div>

      {/* Video + Comment panel */}
      <VideoPlayerProvider>
        <div className="space-y-6">
          <VideoPlayer src={MOCK_PROJECT.videoUrl} showCommentButton={false} />

          {/* Comment history — synchronized via shared store */}
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
              status={commentStatus}
              onResolve={handleResolve}
              isEditor
            />
          </div>
        </div>
      </VideoPlayerProvider>
    </div>
  );
}
