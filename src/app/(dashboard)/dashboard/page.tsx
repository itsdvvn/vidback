import type { Project } from "@/types";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Film, Plus } from "lucide-react";
import Link from "next/link";

// ─── Mock Data (for frontend demo) ───
const MOCK_PROJECTS: (Project & { commentCount: number; unresolvedCount: number })[] = [
  {
    id: "1",
    name: "Client Edit v3 — Final Cut",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    shareToken: "sh72-91sa-k182",
    editorId: "editor-1",
    createdAt: new Date("2025-05-08"),
    commentCount: 6,
    unresolvedCount: 2,
  },
  {
    id: "2",
    name: "Wedding Highlight Reel",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    shareToken: "wq91-00xz-p556",
    editorId: "editor-1",
    createdAt: new Date("2025-05-05"),
    commentCount: 12,
    unresolvedCount: 0,
  },
  {
    id: "3",
    name: "Product Launch Trailer",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    shareToken: "az33-bb72-q109",
    editorId: "editor-1",
    createdAt: new Date("2025-05-01"),
    commentCount: 3,
    unresolvedCount: 3,
  },
];

// True/False to simulate empty state during development
const USE_EMPTY = false;
const USE_LOADING = false;

export default function DashboardPage() {
  // ─── Loading State ───
  if (USE_LOADING) {
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
            <div key={i} className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
              <Skeleton className="aspect-video rounded-lg" />
              <Skeleton className="mt-4 h-5 w-3/4" />
              <Skeleton className="mt-2 h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Empty State ───
  if (USE_EMPTY || MOCK_PROJECTS.length === 0) {
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

  // ─── Success State ───
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Projects
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {MOCK_PROJECTS.length} {MOCK_PROJECTS.length === 1 ? "project" : "projects"} —{" "}
            {MOCK_PROJECTS.reduce((acc, p) => acc + p.unresolvedCount, 0)} open comments
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_PROJECTS.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            commentCount={project.commentCount}
            unresolvedCount={project.unresolvedCount}
          />
        ))}
      </div>
    </div>
  );
}
