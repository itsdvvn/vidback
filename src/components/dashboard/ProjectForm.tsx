"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Upload, Link2, Film } from "lucide-react";

export interface ProjectFormData {
  name: string;
  videoUrl: string;
  /** File selected for upload (handled by parent) */
  videoFile?: File;
}

export interface ProjectFormProps {
  onSubmit: (data: ProjectFormData) => void;
  uploading?: boolean;
  uploadProgress?: number;
}

export function ProjectForm({
  onSubmit,
  uploading = false,
  uploadProgress = 0,
}: ProjectFormProps) {
  const [name, setName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [useUrl, setUseUrl] = useState(true);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [nameError, setNameError] = useState("");
  const [urlError, setUrlError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    let valid = true;
    if (!name.trim()) {
      setNameError("Project name is required.");
      valid = false;
    } else {
      setNameError("");
    }

    if (useUrl && !videoUrl.trim()) {
      setUrlError("Video URL is required.");
      valid = false;
    } else if (useUrl && !isValidUrl(videoUrl.trim())) {
      setUrlError("Please enter a valid URL.");
      valid = false;
    } else {
      setUrlError("");
    }

    if (!useUrl && !videoFile) {
      setUrlError("Please select a video file.");
      valid = false;
    }

    if (!valid) return;

    onSubmit({
      name: name.trim(),
      videoUrl: useUrl ? videoUrl.trim() : "",
      videoFile: videoFile ?? undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="max-w-xl">
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              New Project
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Create a project and share it with your client for feedback.
            </p>
          </div>

          <Input
            id="name"
            label="Project Name"
            placeholder="e.g., Client Edit v2"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError("");
            }}
            error={nameError}
          />

          {/* Toggle: URL vs Upload */}
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Video Source
            </label>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setUseUrl(true)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  useUrl
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
                }`}
              >
                <Link2 className="h-4 w-4" />
                URL
              </button>
              <button
                type="button"
                onClick={() => setUseUrl(false)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  !useUrl
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
                }`}
              >
                <Upload className="h-4 w-4" />
                Upload File
              </button>
            </div>
          </div>

          {useUrl ? (
            <Input
              id="videoUrl"
              label="Video URL"
              placeholder="https://example.com/video.mp4"
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                if (urlError) setUrlError("");
              }}
              error={urlError}
              hint="Paste a direct URL to your video file (MP4, WebM, MOV)"
            />
          ) : (
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Video File
              </label>
              <div className="mt-2">
                <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 px-6 py-10 text-center hover:border-indigo-400 dark:border-zinc-600 dark:hover:border-indigo-400 transition-colors">
                  {videoFile ? (
                    <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                      <Film className="h-5 w-5 text-indigo-500" />
                      {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-zinc-400" />
                      <div>
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Click to select a video
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">
                          MP4, WebM, or MOV (max 2GB)
                        </p>
                      </div>
                    </>
                  )}
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setVideoFile(file);
                      if (urlError) setUrlError("");
                    }}
                  />
                </label>
              </div>
              {urlError && !useUrl && (
                <p className="mt-1.5 text-sm text-red-600">{urlError}</p>
              )}
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Uploading…</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {uploadProgress}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" size="lg" loading={uploading}>
              Create Project
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
