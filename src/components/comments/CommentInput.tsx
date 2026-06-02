"use client";

import {
  useState,
  useEffect,
  useCallback,
  startTransition,
  type FormEvent,
} from "react";
import { Button } from "@/components/ui/Button";
import {
  useVideoPlayerState,
  useVideoPlayerActions,
} from "@/components/video/VideoPlayerProvider";
import type { Annotation } from "@/components/video/VideoPlayerProvider";
import { cn } from "@/lib/utils";
import { NameDropdown, persistName } from "@/components/ui/NameDropdown";
import { MessageSquarePlus, X, Paintbrush } from "lucide-react";

const NAME_STORAGE_KEY = "viback-author-name";

export interface CommentInputProps {
  onSubmit: (data: {
    authorName: string;
    content: string;
    timestamp: number;
    parentId?: number;
    annotations?: string;
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
  const { frozenTimestamp, isCommenting, currentTime, annotationResult } =
    useVideoPlayerState();
  const { cancelComment, startAnnotation } = useVideoPlayerActions();

  const [authorName, setAuthorName] = useState(defaultName || "");
  const [content, setContent] = useState("");
  const [nameError, setNameError] = useState("");
  const [contentError, setContentError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  // Load saved name from localStorage on mount (only for client-side top-level comments)
  useEffect(() => {
    if (defaultName) return;
    try {
      const saved = localStorage.getItem(NAME_STORAGE_KEY);
      if (saved) startTransition(() => setAuthorName(saved));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Receive annotation result from the Konva canvas overlay
  useEffect(() => {
    if (annotationResult && annotationResult.length > 0) {
      startTransition(() => setAnnotations(annotationResult));
    }
  }, [annotationResult]);

  const handleNameConfirm = useCallback((name: string) => {
    persistName(name);
  }, []);

  const timestamp =
    isCommenting && frozenTimestamp !== null ? frozenTimestamp : currentTime;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

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
        annotations:
          annotations.length > 0 ? JSON.stringify(annotations) : undefined,
      });

      setContent("");
      setAnnotations([]);
      if (!parentId) {
        cancelComment();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!forceVisible && !parentId && !isCommenting) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("rounded-xl border border-border bg-card p-4", className)}
    >
      {!parentId && (
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium text-primary">
            <MessageSquarePlus className="h-4 w-4" />
            New Comment at {timestamp.toFixed(1)}s
          </span>
          <button
            type="button"
            onClick={cancelComment}
            className="text-muted-foreground/70 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
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
          <p className="text-xs text-muted-foreground">
            {parentId ? "Replying" : "Commenting"} as{" "}
            <span className="font-medium text-foreground">{defaultName}</span>
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
              "w-full rounded-lg border bg-card px-3 py-2 text-sm text-foreground resize-none",
              "placeholder:text-muted-foreground/70",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              contentError
                ? "border-red-300 focus:ring-red-500"
                : "border-border focus:ring-ring",
            )}
          />
          {contentError && (
            <p className="text-sm text-red-600">{contentError}</p>
          )}
        </div>

        {annotations.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
            <Paintbrush className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-primary font-medium">
              {annotations.length} annotation
              {annotations.length !== 1 ? "s" : ""} attached
            </span>
            <button
              type="button"
              onClick={() => setAnnotations([])}
              className="ml-auto text-primary/70 hover:text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          {!parentId && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={startAnnotation}
                title="Draw freehand shapes, rectangles, circles and arrows on the video"
              >
                <Paintbrush className="h-4 w-4 mr-1" />
                Note Brush
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cancelComment}
              >
                Cancel
              </Button>
            </>
          )}
          <Button type="submit" size="sm" loading={submitting}>
            {parentId ? "Reply" : "Submit Comment"}
          </Button>
        </div>
      </div>
    </form>
  );
}
