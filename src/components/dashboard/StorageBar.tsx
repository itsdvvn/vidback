"use client";

import { cn } from "@/lib/utils";

interface StorageBarProps {
  usedBytes: number;
  limitBytes: number;
  usedVideos: number;
  maxVideos: number;
}

export function StorageBar({
  usedBytes,
  limitBytes,
  usedVideos,
  maxVideos,
}: StorageBarProps) {
  const isUnlimited = !Number.isFinite(limitBytes) || !Number.isFinite(maxVideos);

  const usagePercent =
    Number.isFinite(limitBytes) && limitBytes > 0
      ? Math.min((usedBytes / limitBytes) * 100, 100)
      : 0;

  const colorClass =
    usagePercent >= 95
      ? "bg-red-500"
      : usagePercent >= 80
        ? "bg-amber-500"
        : "bg-blue-500";

  const usedMB = (usedBytes / (1024 * 1024)).toFixed(1);
  const limitMB =
    Number.isFinite(limitBytes)
      ? (limitBytes / (1024 * 1024)).toFixed(0)
      : "∞";

  const videoLabel = isUnlimited
    ? `${usedVideos} video${usedVideos !== 1 ? "s" : ""}`
    : `${usedVideos} of ${maxVideos} videos`;

  return (
    <div className="border-t border-border px-3 py-3 space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Storage</span>
        <span>
          {usedMB} MB / {limitMB} MB
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300", colorClass)}
          style={{ width: `${usagePercent}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground">{videoLabel}</p>
    </div>
  );
}
