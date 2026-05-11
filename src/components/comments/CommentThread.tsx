"use client";

import { useState } from "react";
import type { Comment } from "@/types";
import { CommentItem } from "./CommentItem";
import { CommentInput } from "./CommentInput";
import { ResolveButton } from "./ResolveButton";
import { cn } from "@/lib/utils";

export interface CommentThreadProps {
  comment: Comment;
  onSeek?: (timestamp: number) => void;
  onReply?: (
    parentId: number,
    data: { authorName: string; content: string; timestamp: number },
  ) => void;
  onResolve?: (commentId: number, resolved: boolean) => void;
  isEditor?: boolean;
  /** Pre-fill the reply author name (from editor session) */
  editorName?: string;
  className?: string;
}

export function CommentThread({
  comment,
  onSeek,
  onReply,
  onResolve,
  isEditor = false,
  editorName,
  className,
}: CommentThreadProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Parent comment */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <CommentItem
            comment={comment}
            onSeek={onSeek}
            onClickThread={() => setShowReplyInput((v) => !v)}
          />
        </div>
        {isEditor && onResolve && (
          <ResolveButton
            isResolved={comment.isResolved !== null}
            onToggle={() => onResolve(comment.id, comment.isResolved === null)}
          />
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-6 space-y-2 border-l-2 border-zinc-100 pl-3 dark:border-zinc-700">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <CommentItem comment={reply} onSeek={onSeek} />
              </div>
              {isEditor && onResolve && (
                <ResolveButton
                  isResolved={reply.isResolved !== null}
                  onToggle={() =>
                    onResolve(reply.id, reply.isResolved === null)
                  }
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reply input or button */}
      {isEditor && onReply && (
        <div className="ml-6">
          {showReplyInput ? (
            <CommentInput
              parentId={comment.id}
              onSubmit={(data) => {
                onReply(comment.id, data);
                setShowReplyInput(false);
              }}
              defaultName={editorName}
            />
          ) : (
            <button
              onClick={() => setShowReplyInput(true)}
              className="text-xs font-medium text-indigo-500 hover:text-indigo-600 dark:text-indigo-400"
            >
              Reply
            </button>
          )}
        </div>
      )}
    </div>
  );
}
