"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    // Simulate auth for frontend demo — will be replaced with NextAuth later
    await new Promise((resolve) => setTimeout(resolve, 800));

    // For now, always succeed and redirect
    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Sign in to your editor account.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="editor@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div>
          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="mt-1 text-right text-xs text-zinc-400">
            <a href="#" className="hover:text-indigo-500 transition-colors">
              Forgot password?
            </a>
          </p>
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          Sign In
        </Button>

        <p className="text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign up
          </a>
        </p>
      </form>
    </Card>
  );
}
