"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function BetaCounter() {
  const [stats, setStats] = useState({ current: 0, limit: 10 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/beta/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-8" />;
  }

  const pct = Math.min((stats.current / stats.limit) * 100, 100);
  const full = stats.current >= stats.limit;

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          {full
            ? "Beta is full"
            : `${stats.limit - stats.current} spots remaining`}
        </span>
        <span className="text-muted-foreground">
          {stats.current} / {stats.limit}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            full ? "bg-red-500" : "bg-primary",
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
