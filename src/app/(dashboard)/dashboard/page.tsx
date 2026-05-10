"use client";

import { useState, useEffect } from "react";
import type { Project } from "@/types";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Film, Plus, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { getEditorProjects } from "@/lib/actions";

type ProjectWithCounts = Project & {
  commentCount: number;
  unresolvedCount: number;
  status: string;
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectWithCounts[]>([]);
  const [status, setStatus] = useState<"loading" | "empty" | "error" | "success">(
    "loading",
  );
  const [error, setError] = useState<string>("");

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
            <div
              key={i}
              className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800"
            >
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
          description={error || "Could not connect to the database. Make sure PostgreSQL is running."}
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

  // ─── Success ───
  const totalOpen = projects.reduce(
    (acc, p) => acc + (p.unresolvedCount ?? 0),
    0,
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Projects
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {projects.length} {projects.length === 1 ? "project" : "projects"}{" "}
            — {totalOpen} open comments
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

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
    </div>
  );
}
