"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import {
  useVideoPlayerState,
  useVideoPlayerActions,
} from "@/components/video/VideoPlayerProvider";
import { cn } from "@/lib/utils";
import { NameDropdown, persistName } from "@/components/ui/NameDropdown";
import { MessageSquarePlus, X } from "lucide-react";

const NAME_STORAGE_KEY = "viback-author-name";

export interface CommentInputProps {
  onSubmit: (data: {
    authorName: string;
    content: string;
    timestamp: number;
    parentId?: number;
  }) => void;
  parentId?: number;
  className?: string;
  forceVisible?: boolean;
  /** Pre-fill the author name and hide the input field (used for editor replies) */
  defaultName?: string;
}

export function CommentInput({
  onSubmit,
  parentId,
  className,
  forceVisible = false,
  defaultName,
}: CommentInputProps) {
  const { frozenTimestamp, isCommenting } = useVideoPlayerState();
  const { cancelComment } = useVideoPlayerActions();

  const [authorName, setAuthorName] = useState(defaultName || "");
  const [content, setContent] = useState("");
  const [nameError, setNameError] = useState("");
  const [contentError, setContentError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load saved name from localStorage on mount (only for client-side top-level comments)
  useEffect(() => {
    if (defaultName) return; // editor replies use the provided name
    try {
      const saved = localStorage.getItem(NAME_STORAGE_KEY);
      if (saved) setAuthorName(saved);
    } catch {
      // localStorage unavailable (SSR, private browsing, etc.)
    }
  }, [defaultName]);

  // Persist name to the dropdown's name list too
  const handleNameConfirm = useCallback((name: string) => {
    persistName(name);
  }, []);

  const timestamp = parentId ? (frozenTimestamp ?? 0) : (frozenTimestamp ?? 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Use defaultName when provided (editor replies), otherwise use the input field
    const effectiveName = defaultName || authorName.trim();

    let valid = true;
    if (!effectiveName) {
      setNameError("Your name is required.");
      valid = false;
    } else {
      setNameError("");
    }
    if (!content.trim()) {
      setContentError("Please enter a comment.");
      valid = false;
    } else {
      setContentError("");
    }
    if (!valid) return;

    setSubmitting(true);
    try {
      // Persist the name (only for client-side comments)
      if (!defaultName && effectiveName) {
        try {
          localStorage.setItem(NAME_STORAGE_KEY, effectiveName);
        } catch {
          // ignore
        }
      }

      await onSubmit({
        authorName: effectiveName,
        content: content.trim(),
        timestamp,
        parentId,
      });

      // Only clear the comment text, keep the name
      setContent("");
      if (!parentId) {
        cancelComment();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // For top-level comments, only show when in commenting mode
  // For replies, always show
  if (!forceVisible && !parentId && !isCommenting) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800/50",
        className,
      )}
    >
      {!parentId && (
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
            <MessageSquarePlus className="h-4 w-4" />
            New Comment at {timestamp.toFixed(1)}s
          </span>
          <button
            type="button"
            onClick={cancelComment}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {/* Name field — hidden when defaultName is provided (client identity or editor replies) */}
        {!defaultName && (
          <NameDropdown
            value={authorName}
            onChange={(value) => {
              setAuthorName(value);
              if (nameError) setNameError("");
            }}
            error={nameError}
            onConfirm={handleNameConfirm}
            autoFocus={!parentId}
          />
        )}
        {defaultName && (
          <p className="text-xs text-zinc-500">
            {parentId ? "Replying" : "Commenting"} as{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {defaultName}
            </span>
          </p>
        )}
        <div className="flex flex-col gap-1">
          <textarea
            placeholder={parentId ? "Write a reply…" : "What needs to change?"}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (contentError) setContentError("");
            }}
            rows={3}
            className={cn(
              "w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 resize-none",
              "placeholder:text-zinc-400",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              contentError
                ? "border-red-300 focus:ring-red-500"
                : "border-zinc-200 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
            )}
          />
          {contentError && (
            <p className="text-sm text-red-600">{contentError}</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2">
          {!parentId && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cancelComment}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" size="sm" loading={submitting}>
            {parentId ? "Reply" : "Submit Comment"}
          </Button>
        </div>
      </div>
    </form>
  );
}
