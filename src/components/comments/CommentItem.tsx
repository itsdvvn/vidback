"use client";

import type { Comment } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { Clock, CornerDownRight, PenLine } from "lucide-react";

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
        isResolved ? "border-border bg-muted/50" : "border-border bg-card",
        onSeek && "cursor-pointer hover:border-primary/30",
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
              isResolved ? "text-muted-foreground/70" : "text-foreground",
            )}
          >
            {comment.authorName}
          </span>
          {comment.parentId && (
            <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSeek?.(comment.timestamp);
          }}
          className="flex items-center gap-1 text-xs text-muted-foreground/70 hover:text-primary shrink-0 transition-colors"
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
            ? "text-muted-foreground/70 line-through"
            : "text-foreground",
        )}
      >
        {comment.content}
      </p>

      {/* Annotations badge */}
      {comment.annotations && comment.annotations.length > 0 && (
        <div className="mt-2">
          <Badge variant="info" className="gap-1">
            <PenLine className="h-3 w-3" />
            {comment.annotations.length} annotation
            {comment.annotations.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      )}

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
          className="mt-2 text-xs font-medium text-primary hover:text-primary/90"
        >
          {comment.replies.length}{" "}
          {comment.replies.length === 1 ? "reply" : "replies"}
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
