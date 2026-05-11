"use client";

import type { Comment } from "@/types";
import { CommentThread } from "./CommentThread";
import { Skeleton } from "@/components/ui/Skeleton";
import { MessageCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface CommentListProps {
  comments: Comment[];
  status: "loading" | "empty" | "error" | "success";
  onSeek?: (timestamp: number) => void;
  onReply?: (
    parentId: number,
    data: { authorName: string; content: string; timestamp: number },
  ) => void;
  onResolve?: (commentId: number, resolved: boolean) => void;
  onRetry?: () => void;
  isEditor?: boolean;
  /** Pre-fill the reply author name (from editor session) */
  editorName?: string;
}

export function CommentList({
  comments,
  status,
  onSeek,
  onReply,
  onResolve,
  onRetry,
  isEditor = false,
  editorName,
}: CommentListProps) {
  // ─── Loading ───
  if (status === "loading") {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    );
  }

  // ─── Error ───
  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 px-4">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            Failed to load comments
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            There was an issue loading the comments for this project.
          </p>
        </div>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  // ─── Empty ───
  if (status === "empty" || comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 px-4">
        <MessageCircle className="h-10 w-10 text-muted-foreground/70" />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">No comments yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEditor
              ? "Share this project with your client to start getting feedback."
              : 'Click "Add Comment" while watching the video to leave feedback.'}
          </p>
        </div>
      </div>
    );
  }

  // ─── Success ───
  // Group comments: top-level vs replies
  const topLevel = comments.filter((c) => c.parentId === null);

  return (
    <div className="space-y-3 p-4">
      {topLevel.map((comment) => (
        <CommentThread
          key={comment.id}
          comment={comment}
          onSeek={onSeek}
          onReply={onReply}
          onResolve={onResolve}
          isEditor={isEditor}
          editorName={editorName}
        />
      ))}
    </div>
  );
}
