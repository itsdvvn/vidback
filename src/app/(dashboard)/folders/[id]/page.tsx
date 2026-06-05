"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Project } from "@/types";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { getFolderProjects, renameFolder, deleteFolder } from "@/lib/actions";
import {
  ArrowLeft,
  Film,
  Folder as FolderIcon,
  Plus,
  AlertCircle,
  RefreshCw,
  Pencil,
  Trash2,
} from "lucide-react";

export default function FolderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params?.id as string;

  const [folder, setFolder] = useState<{
    name: string;
    color: string | null;
  } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">(
    "loading",
  );
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoadState("loading");
    setError("");
    try {
      const data = await getFolderProjects(folderId);
      if (data.length > 0) {
        setFolder({
          name: (data as any)[0].folderName || "Folder",
          color: null,
        });
      }
      setProjects(data as Project[]);
      setLoadState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load folder");
      setLoadState("error");
    }
  }, [folderId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load folder metadata separately
  useEffect(() => {
    async function loadFolderMeta() {
      try {
        const folders = await (await import("@/lib/actions")).getUserFolders();
        const f = folders.find((f: any) => f.id === folderId);
        if (f) setFolder({ name: f.name, color: f.color });
      } catch {}
    }
    loadFolderMeta();
  }, [folderId]);

  const handleRename = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await renameFolder(folderId, editName.trim(), editColor || undefined);
      setFolder({ name: editName.trim(), color: editColor || null });
      setEditing(false);
    } catch {}
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteFolder(folderId);
      router.push("/dashboard");
    } catch {}
    setDeleting(false);
  };

  if (loadState === "loading") {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={fetchData} variant="secondary">
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
              <Button size="sm" onClick={handleRename} loading={saving}>
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: folder?.color || "#eab308" }}
              >
                <FolderIcon className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground">
                {folder?.name || "Folder"}
              </h1>
              <button
                onClick={() => {
                  setEditName(folder?.name || "");
                  setEditColor(folder?.color || "#eab308");
                  setEditing(true);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {showDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Delete this folder and its projects?
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDelete(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDelete}
                loading={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Link href={`/projects/new?folderId=${folderId}`}>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Project grid */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Film className="h-12 w-12 text-muted-foreground/70" />
          <p className="text-sm text-muted-foreground">
            No projects in this folder yet.
          </p>
          <Link href="/projects/new">
            <Button>
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              commentCount={0}
              unresolvedCount={0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
