"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Upload, Link2, Film } from "lucide-react";

export interface ProjectFormData {
  name: string;
  videoUrl: string;
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

  // ─── Upload to R2, then submit ───
  const [localUploading, setLocalUploading] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    let valid = true;
    if (!name.trim()) {
      setNameError("Project name is required.");
      valid = false;
    } else {
      setNameError("");
    }

    if (useUrl) {
      if (!videoUrl.trim()) {
        setUrlError("Video URL is required.");
        valid = false;
      } else if (!isValidUrl(videoUrl.trim())) {
        setUrlError("Please enter a valid URL.");
        valid = false;
      } else {
        setUrlError("");
      }
    }

    if (!useUrl && !videoFile) {
      setUrlError("Please select a video file.");
      valid = false;
    }

    if (!valid) return;

    // URL mode — submit directly
    if (useUrl) {
      onSubmit({ name: name.trim(), videoUrl: videoUrl.trim() });
      return;
    }

    // Upload mode — upload to R2 first, then submit
    if (!videoFile) return;

    setLocalUploading(true);
    setLocalProgress(0);

    try {
      // 1. Get a presigned URL from our API
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: videoFile.name,
          contentType: videoFile.type || "video/mp4",
        }),
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || "Failed to get upload URL");
      }

      const { presignedPutUrl, presignedGetUrl } = await uploadRes.json();

      // 2. Upload the file directly to R2 via the presigned PUT URL
      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            setLocalProgress(pct);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else if (xhr.status === 403) {
            reject(
              new Error(
                "Upload rejected — R2 presigned URL expired or invalid",
              ),
            );
          } else {
            reject(new Error(`Upload failed (HTTP ${xhr.status})`));
          }
        });

        xhr.addEventListener("error", () =>
          reject(
            new Error("Network error — browser blocked the upload (CORS?)"),
          ),
        );
        xhr.addEventListener("timeout", () =>
          reject(new Error("Upload timed out")),
        );
        xhr.open("PUT", presignedPutUrl);
        xhr.setRequestHeader("Content-Type", videoFile.type || "video/mp4");
        xhr.send(videoFile);
      });

      // 3. Submit with the presigned GET URL (valid 7 days)
      onSubmit({ name: name.trim(), videoUrl: presignedGetUrl });
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLocalUploading(false);
      setLocalProgress(0);
    }
  };

  const isUploading = uploading || localUploading;
  const progress = localProgress > 0 ? localProgress : uploadProgress;

  return (
    <form onSubmit={handleSubmit}>
      <Card className="max-w-xl">
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              New Project
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
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
            <label className="text-sm font-medium text-foreground">
              Video Source
            </label>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setUseUrl(true)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  useUrl
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
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
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
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
              <label className="text-sm font-medium text-foreground">
                Video File
              </label>
              <div className="mt-2">
                <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border px-6 py-10 text-center hover:border-primary transition-colors">
                  {videoFile ? (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Film className="h-5 w-5 text-primary" />
                      {videoFile.name} (
                      {(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground/70" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Click to select a video
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground/70">
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

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {localUploading
                    ? "Uploading to Cloudflare R2…"
                    : "Creating project…"}
                </span>
                <span className="font-medium text-foreground">{progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" size="lg" loading={isUploading}>
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
