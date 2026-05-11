"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  addToast: (message: string, type?: Toast["type"]) => string;
  removeToast: (id: string) => void;
}

// ─── Context ─────────────────────────────────────────

const ToastContext = createContext<ToastContextType | null>(null);

// ─── Global reference for the standalone toast() function ─

let globalAddToast:
  | ((message: string, type?: Toast["type"]) => string)
  | null = null;

// ─── Provider ────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: Toast["type"] = "info"): string => {
      const id = String(++counterRef.current);
      const toast: Toast = { id, message, type };
      setToasts((prev) => [...prev, toast]);

      // Auto-dismiss after 4 seconds
      setTimeout(() => removeToast(id), 4000);

      return id;
    },
    [removeToast],
  );

  // Expose addToast globally so the standalone toast() function works
  useEffect(() => {
    globalAddToast = addToast;
    return () => {
      globalAddToast = null;
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast container — fixed bottom-right */}
      <div
        className={cn(
          "fixed bottom-4 right-4 z-[9999] flex flex-col gap-2",
          "pointer-events-none",
        )}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Individual Toast Item ──────────────────────────

function ToastItem({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: (id: string) => void;
}) {
  const iconMap = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };
  const Icon = iconMap[toast.type];

  const colorMap: Record<Toast["type"], string> = {
    success:
      "border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200",
    error:
      "border-red-500 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200",
    info:
      "border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center gap-3 rounded-lg border-l-4 px-4 py-3 shadow-lg",
        "animate-slide-in-up",
        colorMap[toast.type],
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="text-sm font-medium">{toast.message}</span>
      <button
        onClick={() => onClose(toast.id)}
        className={cn(
          "ml-auto shrink-0 rounded p-0.5",
          "opacity-60 hover:opacity-100 transition-opacity",
        )}
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Hook (use inside <ToastProvider>) ──────────────

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}

// ─── Standalone shortcut (works outside React tree) ─

export function toast(
  message: string,
  type: Toast["type"] = "info",
): string | undefined {
  return globalAddToast?.(message, type);
}
