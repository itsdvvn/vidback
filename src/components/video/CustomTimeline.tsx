"use client";

import {
  useVideoPlayerState,
  useVideoPlayerActions,
} from "./VideoPlayerProvider";
import { cn } from "@/lib/utils";
import type { MouseEvent, TouchEvent } from "react";

export function CustomTimeline() {
  const { currentTime, duration, comments } = useVideoPlayerState();
  const { seek } = useVideoPlayerActions();

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (clientX: number, container: HTMLElement) => {
    const rect = container.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    seek(ratio * duration);
  };

  const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    handleSeek(e.clientX, container);

    const onMove = (moveEvent: globalThis.MouseEvent) => {
      handleSeek(moveEvent.clientX, container);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    handleSeek(e.touches[0].clientX, container);
  };

  return (
    <div className="mt-2 w-full">
      <div
        className="relative h-8 w-full cursor-pointer group"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {/* Track background */}
        <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 rounded-full bg-zinc-700 group-hover:h-2 transition-all">
          {/* Filled track */}
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-indigo-500"
            style={{ width: `${progress}%` }}
          />
          {/* Comment markers */}
          {comments.map((c) => {
            const position = duration > 0 ? (c.timestamp / duration) * 100 : 0;
            return (
              <div
                key={c.id}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-white cursor-pointer transition-transform hover:scale-150",
                  c.isResolved ? "bg-emerald-500" : "bg-amber-500",
                )}
                style={{ left: `${position}%` }}
                title={`${c.authorName}: ${c.content.slice(0, 50)}…`}
                onClick={(e) => {
                  e.stopPropagation();
                  seek(c.timestamp);
                }}
              />
            );
          })}
        </div>
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-white shadow-md ring-2 ring-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${progress}%` }}
        />
      </div>
      {/* Time labels */}
      <div className="mt-0.5 flex justify-between text-xs text-zinc-400">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
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
