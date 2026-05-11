"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { authClient } from "@/lib/auth-client";
import { updateProfile } from "@/lib/actions";
import { User, Save, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Fetch session on mount
  useEffect(() => {
    authClient
      .getSession()
      .then(({ data }) => {
        if (data?.user) {
          setName(data.user.name || "");
          setEmail(data.user.email || "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const formData = new FormData();
      formData.set("name", name.trim());
      const result = await updateProfile(formData);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-6 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Profile Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Update your editor display name. This is shown on your replies to
          client feedback.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="space-y-5">
            {/* Current email (read-only) */}
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email
              </label>
              <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                <span className="truncate">{email}</span>
              </div>
            </div>

            <Input
              id="name"
              label="Display Name"
              placeholder="Your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
                setSaved(false);
              }}
              error={error}
            />

            {saved && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CheckCircle className="h-4 w-4" />
                Profile updated successfully.
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" loading={saving}>
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
