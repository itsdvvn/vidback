"use client";

import { Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ResolveButtonProps {
  isResolved: boolean;
  onToggle: () => void;
  className?: string;
}

export function ResolveButton({
  isResolved,
  onToggle,
  className,
}: ResolveButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      title={isResolved ? "Mark as unresolved" : "Mark as resolved"}
      className={cn(
        "shrink-0 rounded-full p-1.5 transition-colors",
        isResolved
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-muted text-muted-foreground/70 hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      {isResolved ? (
        <RotateCcw className="h-4 w-4" />
      ) : (
        <Check className="h-4 w-4" />
      )}
    </button>
  );
}
