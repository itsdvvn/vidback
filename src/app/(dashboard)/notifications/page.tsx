"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Notification } from "@/lib/actions";
import { getEditorNotifications } from "@/lib/actions";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";
import { Bell, MessageSquare, Clock } from "lucide-react";

// ─── Helpers ───

function relativeTime(date: Date): string {
  const now = Date.now();
  const then = date.getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max).trimEnd() + "…";
}

// ─── Page ───

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [status, setStatus] = useState<"loading" | "empty" | "error" | "success">(
    "loading",
  );
  const [error, setError] = useState<string>("");

  const fetchNotifications = async () => {
    setStatus("loading");
    setError("");
    try {
      const data = await getEditorNotifications();
      if (data.length === 0) {
        setStatus("empty");
      } else {
        setNotifications(data);
        setStatus("success");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
      setStatus("error");
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ─── Loading ───
  if (status === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
            >
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="mt-2 h-4 w-1/3" />
              <Skeleton className="mt-3 h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Error ───
  if (status === "error") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <EmptyState
          icon={<Bell className="h-16 w-16 text-red-400" />}
          title="Failed to load notifications"
          description={error || "Something went wrong."}
        />
      </div>
    );
  }

  // ─── Empty ───
  if (status === "empty") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <EmptyState
          icon={<Bell className="h-16 w-16" />}
          title="No feedback yet"
          description="Comments from your clients will appear here once someone leaves feedback on your projects."
        />
      </div>
    );
  }

  // ─── Success ───
  const unresolvedCount = notifications.filter((n) => n.isResolved === null).length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Notifications
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {notifications.length}{" "}
          {notifications.length === 1 ? "comment" : "comments"} across your
          projects — {unresolvedCount} unresolved
        </p>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <Link
            key={n.id}
            href={`/projects/${n.projectId}`}
            className="block transition-opacity hover:opacity-90"
          >
            <Card
              className={cn(
                "cursor-pointer transition-shadow hover:shadow-md",
                n.isResolved === null && "border-l-4 border-l-amber-400",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {/* Project name & author */}
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 shrink-0 text-zinc-400" />
                    <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {n.projectName}
                    </span>
                    <span className="text-xs text-zinc-400 shrink-0">
                      by {n.authorName}
                    </span>
                  </div>

                  {/* Comment content */}
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {truncate(n.content, 100)}
                  </p>

                  {/* Meta row */}
                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                      <Clock className="h-3 w-3" />
                      {relativeTime(new Date(n.createdAt))}
                    </span>

                    <span className="text-xs text-zinc-400">
                      at {formatTimestamp(n.timestamp)}
                    </span>

                    <Badge
                      variant={n.isResolved === null ? "warning" : "success"}
                    >
                      {n.isResolved === null ? "Open" : "Resolved"}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
