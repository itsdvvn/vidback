"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Mail, User, ArrowRight, Check } from "lucide-react";

const CLIENT_MAP_KEY = "viback-client-emails";
const CURRENT_CLIENT_KEY = "viback-current-client";

interface ClientIdentityModalProps {
  onComplete: (name: string) => void;
}

type Step = "email" | "name" | "welcome";

/**
 * Load the email→name mapping from localStorage.
 * Returns a parsed Record, or an empty object on failure.
 */
function loadClientMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CLIENT_MAP_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/** Persist the email→name mapping to localStorage. */
function saveClientMap(map: Record<string, string>) {
  try {
    localStorage.setItem(CLIENT_MAP_KEY, JSON.stringify(map));
  } catch {
    // localStorage unavailable (private browsing, etc.)
  }
}

/** Store the current client name in sessionStorage. */
function setCurrentClient(name: string) {
  try {
    sessionStorage.setItem(CURRENT_CLIENT_KEY, name);
  } catch {
    // ignore
  }
}

/** Check if a client is already identified this session. */
export function getCurrentClient(): string | null {
  try {
    return sessionStorage.getItem(CURRENT_CLIENT_KEY);
  } catch {
    return null;
  }
}

export function ClientIdentityModal({ onComplete }: ClientIdentityModalProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const handleEmailSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      const trimmed = email.trim().toLowerCase();
      if (!trimmed) {
        setError("Please enter your email address.");
        return;
      }

      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setError("Please enter a valid email address.");
        return;
      }

      setLoading(true);

      // 1. Check localStorage first
      const clientMap = loadClientMap();
      if (clientMap[trimmed]) {
        const savedName = clientMap[trimmed];
        setCurrentClient(savedName);
        setStep("welcome");
        // Auto-close after a brief welcome flash
        setTimeout(() => onComplete(savedName), 1500);
        return;
      }

      // 2. Check server (DB) as fallback
      try {
        const res = await fetch("/api/client/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed }),
        });

        if (res.ok) {
          const data = (await res.json()) as { found: boolean; name?: string };
          const serverName = data.name;
          if (data.found && serverName) {
            // Save to localStorage for future visits
            clientMap[trimmed] = serverName;
            saveClientMap(clientMap);
            setCurrentClient(serverName);
            setStep("welcome");
            setTimeout(() => onComplete(serverName), 1500);
            return;
          }
        }
      } catch {
        // Server unavailable — proceed to name step
      }

      setLoading(false);
      setStep("name");
    },
    [email, onComplete],
  );

  const handleNameSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      const trimmed = name.trim();
      if (!trimmed) {
        setError("Please enter your name.");
        return;
      }

      const trimmedEmail = email.trim().toLowerCase();

      // Persist mapping and current client
      const clientMap = loadClientMap();
      clientMap[trimmedEmail] = trimmed;
      saveClientMap(clientMap);
      setCurrentClient(trimmed);

      onComplete(trimmed);
    },
    [name, email, onComplete],
  );

  // ─── Step 1: Email ───
  if (step === "email") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Enter your email to continue"
      >
        <Card className="w-full max-w-sm animate-in fade-in zoom-in duration-200">
          <CardHeader>
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-center">Enter your email</CardTitle>
            <CardDescription className="text-center">
              We&apos;ll remember you for next time.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleEmailSubmit}>
            <div className="space-y-4">
              <Input
                id="client-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                error={error}
                autoFocus
                autoComplete="email"
              />
              <Button type="submit" className="w-full" loading={loading}>
                Continue
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  // ─── Step 2: Name ───
  if (step === "name") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        aria-label="What's your name?"
      >
        <Card className="w-full max-w-sm animate-in fade-in zoom-in duration-200">
          <CardHeader>
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-center">
              What&apos;s your name?
            </CardTitle>
            <CardDescription className="text-center">
              This will appear on your feedback.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleNameSubmit}>
            <div className="space-y-4">
              <Input
                id="client-name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                error={error}
                autoFocus
                autoComplete="given-name"
              />
              <Button type="submit" className="w-full">
                Get Started
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  // ─── Welcome back (brief flash, then auto-close) ───
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome back"
    >
      <Card className="w-full max-w-sm animate-in fade-in zoom-in duration-200 text-center">
        <CardHeader>
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-center">Welcome back!</CardTitle>
          <CardDescription className="text-center">
            You&apos;re all set to leave feedback.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
