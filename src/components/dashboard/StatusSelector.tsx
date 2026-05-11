"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

const STATUSES = [
  "Under Review",
  "In Progress",
  "Approved",
  "Needs Revision",
] as const;
type ProjectStatus = (typeof STATUSES)[number];

type BadgeVariant = "warning" | "info" | "success" | "danger";

const statusBadgeVariant: Record<ProjectStatus, BadgeVariant> = {
  "Under Review": "warning",
  "In Progress": "info",
  Approved: "success",
  "Needs Revision": "danger",
};

const badgeStyles: Record<BadgeVariant, string> = {
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50",
  success:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50",
  danger:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50",
};

interface StatusSelectorProps {
  current: ProjectStatus;
  onChange: (status: string) => void;
}

export function StatusSelector({ current, onChange }: StatusSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const variant = statusBadgeVariant[current];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer",
          badgeStyles[variant],
        )}
      >
        {current}
        <svg
          className={cn("h-3 w-3 transition-transform", open && "rotate-180")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-20 w-40 rounded-lg border border-border bg-card py-1 shadow-lg">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
              className={cn(
                "block w-full px-3 py-1.5 text-left text-sm transition-colors",
                s === current
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-muted",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
