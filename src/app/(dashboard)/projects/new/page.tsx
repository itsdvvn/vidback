"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ProjectForm,
  type ProjectFormData,
} from "@/components/dashboard/ProjectForm";
import { ShareLinkCopy } from "@/components/dashboard/ShareLinkCopy";
import { Card } from "@/components/ui/Card";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createProject } from "@/lib/actions";

export default function NewProjectPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const [created, setCreated] = useState<{
    id: string;
    name: string;
    shareToken: string;
  } | null>(null);

  const handleSubmit = async (data: ProjectFormData) => {
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.set("name", data.name);
      formData.set("videoUrl", data.videoUrl);

      const project = await createProject(formData);
      setCreated({
        id: project.id,
        name: data.name,
        shareToken: project.shareToken,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setUploading(false);
    }
  };

  // ─── Success ───
  if (created) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16">
        <Card className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
          <h2 className="mt-4 text-xl font-semibold text-foreground">
            Project Created!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
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
            <Button onClick={() => router.push(`/projects/${created.id}`)}>
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
        <h1 className="text-2xl font-bold text-foreground">New Project</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      <ProjectForm onSubmit={handleSubmit} uploading={uploading} />
    </div>
  );
}
