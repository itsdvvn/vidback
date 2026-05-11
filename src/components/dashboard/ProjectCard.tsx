import type { Project } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { BadgeVariant } from "@/components/ui/Badge";
import { Film, MessageSquare, Calendar } from "lucide-react";
import Link from "next/link";

const statusVariantMap: Record<string, BadgeVariant> = {
  "Under Review": "warning",
  "In Progress": "info",
  Approved: "success",
  "Needs Revision": "danger",
};

export interface ProjectCardProps {
  project: Project;
  commentCount?: number;
  unresolvedCount?: number;
}

export function ProjectCard({
  project,
  commentCount = 0,
  unresolvedCount = 0,
}: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="group h-full cursor-pointer transition-all hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600">
        {/* Thumbnail */}
        <div className="mb-4 aspect-video rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden relative">
          {project.thumbnailUrl ? (
            <img
              src={project.thumbnailUrl}
              alt={project.name}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <Film className="h-10 w-10 text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-400 transition-colors" />
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {project.name}
          </h3>

          {project.status && (
            <div className="mt-1">
              <Badge variant={statusVariantMap[project.status] ?? "default"}>
                {project.status}
              </Badge>
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {commentCount} {commentCount === 1 ? "comment" : "comments"}
            </span>
            {unresolvedCount > 0 && (
              <Badge variant="warning">{unresolvedCount} open</Badge>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <Calendar className="h-3 w-3" />
            {new Date(project.createdAt).toLocaleDateString()}
          </div>
        </div>
      </Card>
    </Link>
  );
}
