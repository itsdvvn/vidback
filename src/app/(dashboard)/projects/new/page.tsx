"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectForm, type ProjectFormData } from "@/components/dashboard/ProjectForm";
import { ShareLinkCopy } from "@/components/dashboard/ShareLinkCopy";
import { Card } from "@/components/ui/Card";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NewProjectPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [created, setCreated] = useState<{ name: string; shareToken: string } | null>(null);

  const handleSubmit = async (data: ProjectFormData) => {
    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    clearInterval(interval);
    setUploadProgress(100);

    // Simulate success
    const shareToken = generateShareToken();
    setTimeout(() => {
      setUploading(false);
      setCreated({ name: data.name, shareToken });
    }, 500);
  };

  // ─── Success state after creation ───
  if (created) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16">
        <Card className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
          <h2 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Project Created!
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            <strong>{created.name}</strong> is ready for review. Share the link
            below with your client.
          </p>
          <div className="mt-6">
            <ShareLinkCopy shareToken={created.shareToken} />
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Button
              variant="secondary"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </Button>
            <Button
              onClick={() =>
                router.push(`/projects/new`) // In real app: redirect to project detail
              }
            >
              View Project
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          New Project
        </h1>
      </div>
      <ProjectForm
        onSubmit={handleSubmit}
        uploading={uploading}
        uploadProgress={uploadProgress}
      />
    </div>
  );
}

/** Generate a random share token similar to "sh72-91sa-k182" */
function generateShareToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const groups = 3;
  const groupLength = 4;
  const result: string[] = [];
  for (let g = 0; g < groups; g++) {
    let group = "";
    for (let i = 0; i < groupLength; i++) {
      group += chars[Math.floor(Math.random() * chars.length)];
    }
    result.push(group);
  }
  return result.join("-");
}
