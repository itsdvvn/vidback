"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { Check, Plus, User, Users } from "lucide-react";

const SAVED_NAMES_KEY = "viback-saved-names";

/** Load saved names from localStorage */
function loadSavedNames(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_NAMES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((n): n is string => typeof n === "string" && n.trim().length > 0);
    }
  } catch { /* ignore */ }
  return [];
}

/** Save a name to the list (max 10, most recent first) */
function persistName(name: string) {
  if (!name.trim()) return;
  const names = loadSavedNames().filter((n) => n !== name.trim());
  names.unshift(name.trim());
  if (names.length > 10) names.length = 10;
  try {
    localStorage.setItem(SAVED_NAMES_KEY, JSON.stringify(names));
  } catch { /* ignore */ }
}

export interface NameDropdownProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** Called when the user explicitly confirms a name (pressed enter or selected) */
  onConfirm?: (name: string) => void;
  autoFocus?: boolean;
}

export function NameDropdown({ value, onChange, error, onConfirm, autoFocus }: NameDropdownProps) {
  const [open, setOpen] = useState(false);
  const [savedNames, setSavedNames] = useState<string[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load saved names on mount and when opened
  useEffect(() => {
    if (open) {
      setSavedNames(loadSavedNames());
      setHighlightIndex(-1);
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = value.trim()
    ? savedNames.filter((n) => n.toLowerCase().includes(value.toLowerCase()))
    : savedNames;

  const handleSelect = (name: string) => {
    onChange(name);
    persistName(name);
    setOpen(false);
    onConfirm?.(name);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < filtered.length) {
          handleSelect(filtered[highlightIndex]);
        } else if (value.trim()) {
          // No item highlighted — use the typed value
          persistName(value.trim());
          onConfirm?.(value.trim());
          setOpen(false);
        }
        break;
      case "Escape":
        setOpen(false);
        break;
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Your name"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!open) setOpen(true);
            setHighlightIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          className={cn(
            "h-10 w-full rounded-lg border bg-white pl-9 pr-3 text-sm text-zinc-900",
            "placeholder:text-zinc-400",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            error
              ? "border-red-300 focus:ring-red-500"
              : "border-zinc-200 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
          )}
        />
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {/* Dropdown */}
      {open && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
        >
          {filtered.length > 0 ? (
            filtered.map((name, i) => (
              <button
                key={name}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(name);
                }}
                onMouseEnter={() => setHighlightIndex(i)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                  i === highlightIndex
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                    : "text-zinc-700 dark:text-zinc-300",
                  name === value && "font-medium",
                )}
              >
                <User className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <span className="flex-1 truncate">{name}</span>
                {name === value && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                )}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-zinc-400">
              {value.trim() ? (
                <span className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  Type your name and press Enter
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  Start typing to find a saved name
                </span>
              )}
            </div>
          )}

          {/* Add current name button */}
          {value.trim() && !savedNames.includes(value.trim()) && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(value.trim());
              }}
              className="flex w-full items-center gap-2 border-t border-zinc-100 px-3 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 dark:border-zinc-700 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add &quot;{value.trim()}&quot;</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Save a name to the persistent list (called externally after confirmed submission) */
export { persistName };
