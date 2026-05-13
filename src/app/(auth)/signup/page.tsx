"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Eye, EyeOff } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [formStart] = useState(Date.now());

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    // Anti-bot: honeypot check (bots often fill hidden fields)
    if (honeypot) {
      setError("Invalid submission.");
      return;
    }

    // Anti-bot: form submission speed check (< 2 seconds = likely a bot)
    if (Date.now() - formStart < 2000) {
      setError("Please wait before submitting.");
      return;
    }

    // Check beta capacity
    try {
      const statsRes = await fetch("/api/beta/stats");
      const stats = await statsRes.json();
      if (stats.current >= stats.limit) {
        setError("Beta is full! All 10 spots are taken.");
        return;
      }
    } catch {
      // If stats endpoint fails, proceed anyway
    }

    setLoading(true);

    try {
      const { error: signUpError } = await authClient.signUp.email({
        email: email.trim(),
        password: password.trim(),
        name: name.trim(),
        callbackURL: "/dashboard",
      });

      if (signUpError) {
        setError(signUpError.message || "Registration failed");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Registration failed. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Register as a new editor.
          </p>
        </div>

        {/* Hidden honeypot field — invisible to humans, but bots will fill it */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <Input
          id="name"
          label="Name"
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError("");
          }}
        />

        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="editor@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
          }}
        />

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground/70">
            At least 8 characters
          </p>
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          Create Account
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary/90"
          >
            Sign in
          </Link>
        </p>
      </form>
    </Card>
  );
}
