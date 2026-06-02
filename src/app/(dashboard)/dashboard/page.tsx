"use client";

import { useState, useEffect, useCallback } from "react";
import type { Project, Folder as FolderType } from "@/types";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Film,
  Plus,
  Folder as FolderIcon,
  FolderPlus,
  AlertCircle,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  Columns3,
  MessageSquare,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import {
  getEditorProjects,
  updateProjectStatus,
  getUserFolders,
  createFolder,
} from "@/lib/actions";
import { cn } from "@/lib/utils";

type ProjectWithCounts = Project & {
  commentCount: number;
  unresolvedCount: number;
  status: string;
};

const STATUSES = ["Under Review", "In Progress", "Approved", "Needs Revision"];

const statusColors: Record<string, string> = {
  "Under Review":
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "In Progress":
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Approved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Needs Revision":
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const statusVariantMap: Record<string, BadgeVariant> = {
  "Under Review": "warning",
  "In Progress": "info",
  Approved: "success",
  "Needs Revision": "danger",
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectWithCounts[]>([]);
  const [folders, setFolders] = useState<
    (FolderType & { projectCount: number })[]
  >([]);
  const [status, setStatus] = useState<
    "loading" | "empty" | "error" | "success"
  >("loading");
  const [error, setError] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "table" | "kanban">("grid");

  // Load view preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dashboardViewMode");
    if (saved === "grid" || saved === "table" || saved === "kanban") {
      setViewMode(saved);
    }
  }, []);

  // Persist view preference
  useEffect(() => {
    localStorage.setItem("dashboardViewMode", viewMode);
  }, [viewMode]);

  const fetchData = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const [projectData, folderData] = await Promise.all([
        getEditorProjects(),
        getUserFolders(),
      ]);
      setProjects(projectData as ProjectWithCounts[]);
      setFolders(folderData as (FolderType & { projectCount: number })[]);
      setStatus(
        projectData.length === 0 && folderData.length === 0
          ? "empty"
          : "success",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      setStatus("error");
    }
  }, []);

  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderColor, setFolderColor] = useState("#eab308");
  const [creatingFolder, setCreatingFolder] = useState(false);

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    setCreatingFolder(true);
    try {
      const fd = new FormData();
      fd.set("name", folderName.trim());
      fd.set("color", folderColor);
      await createFolder(fd);
      setShowCreateFolder(false);
      setFolderName("");
      await fetchData();
    } catch {
      /* ignore */
    } finally {
      setCreatingFolder(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Loading ───
  if (status === "loading") {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-6">
              <Skeleton className="aspect-video rounded-lg" />
              <Skeleton className="mt-4 h-5 w-3/4" />
              <Skeleton className="mt-2 h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Error ───
  if (status === "error") {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <EmptyState
          icon={<AlertCircle className="h-16 w-16 text-red-400" />}
          title="Failed to load projects"
          description={
            error ||
            "Could not connect to the database. Make sure PostgreSQL is running."
          }
          action={
            <Button onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  // ─── Empty ───
  if (status === "empty") {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <EmptyState
          icon={<Film className="h-16 w-16" />}
          title="Create your first project"
          description="Upload a video and share a link with your client to start collecting time-coded feedback."
          action={
            <Link href="/projects/new">
              <Button>
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const unfiledProjects = projects.filter((p) => !p.folderId);

  // ─── View Toggle Options ───
  const viewOptions: {
    value: "grid" | "table" | "kanban";
    icon: React.ReactNode;
    label: string;
  }[] = [
    { value: "grid", icon: <LayoutGrid className="h-4 w-4" />, label: "Grid" },
    {
      value: "table",
      icon: <TableIcon className="h-4 w-4" />,
      label: "Table",
    },
    {
      value: "kanban",
      icon: <Columns3 className="h-4 w-4" />,
      label: "Kanban",
    },
  ];

  // ─── Success ───
  const totalOpen = projects.reduce(
    (acc, p) => acc + (p.unresolvedCount ?? 0),
    0,
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
            {folders.length > 0 &&
              ` — ${folders.length} ${folders.length === 1 ? "folder" : "folders"}`}
            {totalOpen > 0 && ` — ${totalOpen} open`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border bg-muted p-0.5">
            {viewOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setViewMode(option.value)}
                className={cn(
                  "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  viewMode === option.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
                aria-label={`${option.label} view`}
                title={option.label}
              >
                {option.icon}
              </button>
            ))}
          </div>
          {showCreateFolder ? (
            <div className="flex items-center gap-2">
              <input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Folder name"
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") setShowCreateFolder(false);
                }}
              />
              <Button
                size="sm"
                onClick={handleCreateFolder}
                loading={creatingFolder}
              >
                Create
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowCreateFolder(false);
                  setFolderName("");
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateFolder(true)}
            >
              <FolderPlus className="h-4 w-4 mr-1" />
              New Folder
            </Button>
          )}
          <Link href="/projects/new">
            <Button>
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── Folders Grid ─── */}
      {folders.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Folders
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {folders.map((folder) => (
              <Link
                key={folder.id}
                href={`/folders/${folder.id}`}
                className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: folder.color || "#eab308" }}
                  >
                    <FolderIcon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <h3 className="mt-3 font-medium text-foreground group-hover:text-primary transition-colors">
                  {folder.name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {folder.projectCount}{" "}
                  {folder.projectCount === 1 ? "project" : "projects"}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─── Grid View ─── */}
      {viewMode === "grid" && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {unfiledProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              commentCount={project.commentCount ?? 0}
              unresolvedCount={project.unresolvedCount ?? 0}
            />
          ))}
        </div>
      )}

      {/* ─── Table View ─── */}
      {viewMode === "table" && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                  Comments
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                  Unresolved
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Created
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Thumbnail
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {unfiledProjects.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={project.status || "Under Review"}
                      onChange={async (e) => {
                        try {
                          await updateProjectStatus(project.id, e.target.value);
                          fetchData();
                        } catch {
                          /* ignore */
                        }
                      }}
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {[
                        "Under Review",
                        "In Progress",
                        "Approved",
                        "Needs Revision",
                      ].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {project.commentCount ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {(project.unresolvedCount ?? 0) > 0 ? (
                      <Badge variant="warning">{project.unresolvedCount}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {project.thumbnailUrl ? (
                      <img
                        src={project.thumbnailUrl}
                        alt={project.name}
                        className="h-10 w-16 rounded object-cover ml-auto"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-10 w-16 rounded bg-muted flex items-center justify-center ml-auto">
                        <Film className="h-4 w-4 text-muted-foreground/70" />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Kanban View ─── */}
      {viewMode === "kanban" && (
        <KanbanBoard projects={unfiledProjects} fetchProjects={fetchData} />
      )}
    </div>
  );
}

// ─── KanbanBoard (extracted for touch support) ───

function KanbanBoard({
  projects,
  fetchProjects,
}: {
  projects: ProjectWithCounts[];
  fetchProjects: () => Promise<void>;
}) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUSES.map((statusName) => {
        const columnProjects = projects.filter((p) => p.status === statusName);
        return (
          <div
            key={statusName}
            data-status={statusName}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add("bg-accent/50");
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove("bg-accent/50");
            }}
            onDrop={async (e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("bg-accent/50");
              const projectId = e.dataTransfer.getData("text/plain");
              const newStatus = statusName;
              try {
                await updateProjectStatus(projectId, newStatus);
                fetchProjects();
              } catch {
                /* ignore */
              }
            }}
            className="min-w-[260px] flex-shrink-0 rounded-xl border border-border bg-muted/20 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    statusColors[statusName],
                  )}
                >
                  {statusName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {columnProjects.length}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {columnProjects.map((project) => (
                <div
                  key={project.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", project.id);
                    e.currentTarget.classList.add("opacity-50");
                  }}
                  onDragEnd={(e) => {
                    e.currentTarget.classList.remove("opacity-50");
                  }}
                  onTouchStart={(e) => {
                    const el = e.currentTarget;
                    setDraggedItem(project.id);
                    el.style.opacity = "0.5";
                  }}
                  onTouchEnd={async (e) => {
                    const el = e.currentTarget;
                    el.style.opacity = "1";
                    const touch = e.changedTouches[0];
                    const target = document.elementFromPoint(
                      touch.clientX,
                      touch.clientY,
                    ) as HTMLElement | null;
                    const column = target?.closest("[data-status]");
                    if (column) {
                      const newStatus = column.getAttribute("data-status");
                      if (newStatus && draggedItem) {
                        try {
                          await updateProjectStatus(draggedItem, newStatus);
                          fetchProjects();
                        } catch {
                          /* ignore */
                        }
                      }
                    }
                    setDraggedItem(null);
                  }}
                >
                  <Link
                    href={`/projects/${project.id}`}
                    className="block max-w-[265px] rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
                  >
                    {project.thumbnailUrl && (
                      <div className="h-24 rounded-md overflow-hidden bg-muted mb-2">
                        <img
                          src={project.thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <p className="text-sm font-medium text-foreground truncate">
                      {project.name}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {project.commentCount ?? 0}
                      </span>
                      {(project.unresolvedCount ?? 0) > 0 && (
                        <Badge variant="warning">
                          {project.unresolvedCount} open
                        </Badge>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
              {columnProjects.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-6">
                  No projects
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
