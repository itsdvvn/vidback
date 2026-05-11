"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Notification } from "@/lib/actions";
import { getEditorNotifications } from "@/lib/actions";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";
import { Bell, MessageSquare, Clock, CheckCircle } from "lucide-react";

// ─── Helpers ───

const STORAGE_KEY = "viback-last-read-timestamp";

function getLastReadTimestamp(): number {
  if (typeof window === "undefined") return 0;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? parseInt(stored, 10) : 0;
}

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
  const [status, setStatus] = useState<
    "loading" | "empty" | "error" | "success"
  >("loading");
  const [error, setError] = useState<string>("");
  const [lastReadTimestamp, setLastReadTimestamp] = useState<number>(0);

  // Read stored timestamp on mount
  useEffect(() => {
    setLastReadTimestamp(getLastReadTimestamp());
  }, []);

  const markAllAsRead = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY, String(now));
    setLastReadTimestamp(now);
  }, []);

  const isUnread = useCallback(
    (n: Notification) => {
      const createdAt = new Date(n.createdAt).getTime();
      return createdAt > lastReadTimestamp;
    },
    [lastReadTimestamp],
  );

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
      setError(
        err instanceof Error ? err.message : "Failed to load notifications",
      );
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
            <div key={i} className="rounded-xl border border-border p-5">
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
  const unresolvedCount = notifications.filter(
    (n) => n.isResolved === null,
  ).length;
  const unreadCount = notifications.filter((n) => isUnread(n)).length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {notifications.length}{" "}
            {notifications.length === 1 ? "comment" : "comments"} across your
            projects — {unresolvedCount} unresolved
            {unreadCount > 0 && `, ${unreadCount} unread`}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="shrink-0"
          >
            <CheckCircle className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map((n) => {
          const unread = isUnread(n);
          return (
            <Link
              key={n.id}
              href={`/projects/${n.projectId}`}
              onClick={unread ? markAllAsRead : undefined}
              className="block transition-opacity hover:opacity-90"
            >
              <Card
                className={cn(
                  "cursor-pointer transition-shadow hover:shadow-md",
                  n.isResolved === null && "border-l-4 border-l-amber-400",
                  unread && "bg-blue-50/70 dark:bg-blue-950/15",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Project name & author */}
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                      <span
                        className={cn(
                          "text-sm text-foreground truncate",
                          unread ? "font-semibold" : "font-medium",
                        )}
                      >
                        {n.projectName}
                      </span>
                      <span className="text-xs text-muted-foreground/70 shrink-0">
                        by {n.authorName}
                      </span>
                      {unread && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>

                    {/* Comment content */}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {truncate(n.content, 100)}
                    </p>

                    {/* Meta row */}
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/70">
                        <Clock className="h-3 w-3" />
                        {relativeTime(new Date(n.createdAt))}
                      </span>

                      <span className="text-xs text-muted-foreground/70">
                        at {formatTimestamp(n.timestamp)}
                      </span>

                      <Badge
                        variant={
                          unread
                            ? "info"
                            : n.isResolved === null
                              ? "warning"
                              : "success"
                        }
                      >
                        {unread
                          ? "Unread"
                          : n.isResolved === null
                            ? "Open"
                            : "Resolved"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
