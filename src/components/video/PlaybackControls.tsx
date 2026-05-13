"use client";

import { useEffect } from "react";
import {
  useVideoPlayerState,
  useVideoPlayerActions,
} from "./VideoPlayerProvider";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  MessageSquarePlus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface PlaybackControlsProps {
  showCommentButton?: boolean;
  className?: string;
}

export function PlaybackControls({
  showCommentButton = false,
  className,
}: PlaybackControlsProps) {
  const { isPlaying, currentTime, duration, isCommenting } =
    useVideoPlayerState();
  const { togglePlay, rewind10, forward10, startComment } =
    useVideoPlayerActions();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "c":
        case "C":
          e.preventDefault();
          startComment();
          break;
        case "j":
        case "J":
          rewind10();
          break;
        case "k":
        case "K":
          togglePlay();
          break;
        case "l":
        case "L":
          forward10();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, rewind10, forward10, startComment]);

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-b-xl bg-zinc-900 px-4 py-3",
        className,
      )}
    >
      <button
        onClick={rewind10}
        aria-label="Rewind 10 seconds"
        title="Rewind 10s (J)"
        className="rounded-lg p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
      >
        <SkipBack className="h-5 w-5" />
      </button>

      <button
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
        title={isPlaying ? "Pause (Space)" : "Play (Space)"}
        className="rounded-lg p-2.5 text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" fill="currentColor" />
        )}
      </button>

      <button
        onClick={forward10}
        aria-label="Forward 10 seconds"
        title="Forward 10s (L)"
        className="rounded-lg p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
      >
        <SkipForward className="h-5 w-5" />
      </button>

      <div className="ml-3 text-sm font-mono text-zinc-400 tabular-nums">
        {formatTime(currentTime)} <span className="text-zinc-600">/</span>{" "}
        {formatTime(duration)}
      </div>

      <div className="flex-1" />

      {showCommentButton && (
        <Button
          size="sm"
          variant={isCommenting ? "secondary" : "primary"}
          onClick={startComment}
          disabled={isCommenting}
        >
          <MessageSquarePlus className="h-4 w-4" />
          Add Comment
        </Button>
      )}

      <div className="hidden sm:flex items-center gap-3 ml-4 text-xs text-zinc-500">
        <span>
          <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-zinc-300">
            Space
          </kbd>
        </span>
        <span>
          <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-zinc-300">
            J
          </kbd>
        </span>
        <span>
          <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-zinc-300">
            K
          </kbd>
        </span>
        <span>
          <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-zinc-300">
            L
          </kbd>
        </span>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
