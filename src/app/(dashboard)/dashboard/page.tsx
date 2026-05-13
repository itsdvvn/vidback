"use client";

import { useState, useEffect } from "react";
import type { Project } from "@/types";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Film,
  Plus,
  AlertCircle,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  Columns3,
  MessageSquare,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { getEditorProjects } from "@/lib/actions";
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

  const fetchProjects = async () => {
    setStatus("loading");
    setError("");
    try {
      const data = await getEditorProjects();
      if (data.length === 0) {
        setStatus("empty");
      } else {
        setProjects(data as ProjectWithCounts[]);
        setStatus("success");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
      setStatus("error");
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

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
            <Button onClick={fetchProjects}>
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
            {projects.length} {projects.length === 1 ? "project" : "projects"} —{" "}
            {totalOpen} open comments
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
          <Link href="/projects/new">
            <Button>
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── Grid View ─── */}
      {viewMode === "grid" && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
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
              {projects.map((project) => (
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
                    {project.status && (
                      <Badge
                        variant={statusVariantMap[project.status] ?? "default"}
                      >
                        {project.status}
                      </Badge>
                    )}
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
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((statusName) => {
            const columnProjects = projects.filter(
              (p) => p.status === statusName,
            );
            return (
              <div
                key={statusName}
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
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="block rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
                    >
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
      )}
    </div>
  );
}
