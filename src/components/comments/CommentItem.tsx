"use client";

import type { Comment } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { Clock, CornerDownRight } from "lucide-react";

export interface CommentItemProps {
  comment: Comment;
  onSeek?: (timestamp: number) => void;
  onClickThread?: () => void;
  className?: string;
}

export function CommentItem({
  comment,
  onSeek,
  onClickThread,
  className,
}: CommentItemProps) {
  const isResolved = comment.isResolved !== null;

  return (
    <div
      className={cn(
        "group rounded-lg border p-3 transition-colors",
        isResolved
          ? "border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50"
          : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800",
        onSeek && "cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600",
        className,
      )}
      onClick={() => onSeek?.(comment.timestamp)}
    >
      {/* Header */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "text-sm font-medium truncate",
              isResolved
                ? "text-zinc-400 dark:text-zinc-500"
                : "text-zinc-900 dark:text-zinc-100",
            )}
          >
            {comment.authorName}
          </span>
          {comment.parentId && (
            <CornerDownRight className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600 shrink-0" />
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSeek?.(comment.timestamp);
          }}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-indigo-500 shrink-0 transition-colors"
        >
          <Clock className="h-3 w-3" />
          {formatTimestamp(comment.timestamp)}
        </button>
      </div>

      {/* Body */}
      <p
        className={cn(
          "text-sm",
          isResolved
            ? "text-zinc-400 line-through dark:text-zinc-500"
            : "text-zinc-700 dark:text-zinc-300",
        )}
      >
        {comment.content}
      </p>

      {/* Status badge */}
      {isResolved && (
        <div className="mt-2">
          <Badge variant="success">Resolved</Badge>
        </div>
      )}

      {/* Reply count indicator */}
      {comment.replies && comment.replies.length > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onClickThread) onClickThread();
          }}
          className="mt-2 text-xs font-medium text-indigo-500 hover:text-indigo-600 dark:text-indigo-400"
        >
          {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
        </button>
      )}
    </div>
  );
}

function formatTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${m}:${s.toString().padStart(2, "0")}.${ms}`;
}
