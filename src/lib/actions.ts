"use server";

import { db } from "@/db";
import { projects, comments, user } from "@/db/schema";
import { eq, and, isNull, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// ─── Helpers ───

async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
  return session;
}

// ─── Projects ───

export async function getEditorProjects() {
  const session = await requireAuth();

  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.editorId, session.user.id))
    .orderBy(projects.createdAt);

  return Promise.all(
    rows.map(async (p) => {
      const [total] = await db
        .select({ count: count() })
        .from(comments)
        .where(eq(comments.projectId, p.id));

      const [open] = await db
        .select({ count: count() })
        .from(comments)
        .where(and(eq(comments.projectId, p.id), isNull(comments.isResolved)));

      return {
        ...p,
        commentCount: total.count,
        unresolvedCount: open.count,
      };
    }),
  );
}

export async function getProjectWithCounts(projectId: string) {
  const session = await requireAuth();

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) throw new Error("Not found");

  // Ensure the editor owns this project
  if (project.editorId !== session.user.id) {
    throw new Error("Forbidden");
  }

  const [total] = await db
    .select({ count: count() })
    .from(comments)
    .where(eq(comments.projectId, projectId));

  const [open] = await db
    .select({ count: count() })
    .from(comments)
    .where(and(eq(comments.projectId, projectId), isNull(comments.isResolved)));

  return {
    ...project,
    commentCount: total.count,
    unresolvedCount: open.count,
  };
}

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  videoUrl: z.string().url("Must be a valid URL"),
});

export async function createProject(formData: FormData) {
  const session = await requireAuth();

  const parsed = createProjectSchema.parse({
    name: formData.get("name"),
    videoUrl: formData.get("videoUrl"),
  });

  const shareToken = `${nanoid(4)}-${nanoid(4)}-${nanoid(4)}`;

  const [project] = await db
    .insert(projects)
    .values({
      name: parsed.name,
      videoUrl: parsed.videoUrl,
      shareToken,
      editorId: session.user.id,
    })
    .returning();

  revalidatePath("/dashboard");
  return project;
}

export async function updateProjectStatus(projectId: string, status: string) {
  const session = await requireAuth();

  // Verify ownership
  const [project] = await db
    .select({ editorId: projects.editorId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) throw new Error("Not found");
  if (project.editorId !== session.user.id) throw new Error("Forbidden");

  await db
    .update(projects)
    .set({ status, updatedAt: new Date() })
    .where(eq(projects.id, projectId));

  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProject(projectId: string) {
  const session = await requireAuth();

  // Verify ownership
  const [project] = await db
    .select({ editorId: projects.editorId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) throw new Error("Not found");
  if (project.editorId !== session.user.id) throw new Error("Forbidden");

  await db.delete(projects).where(eq(projects.id, projectId));
  revalidatePath("/dashboard");
}

// ─── Comments (Editor) ───

export async function getProjectComments(projectId: string) {
  const session = await requireAuth();

  // Verify ownership
  const [project] = await db
    .select({ editorId: projects.editorId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) throw new Error("Not found");
  if (project.editorId !== session.user.id) throw new Error("Forbidden");

  const all = await db
    .select()
    .from(comments)
    .where(eq(comments.projectId, projectId))
    .orderBy(comments.timestamp);

  const topLevel = all.filter((c) => c.parentId === null);
  return topLevel.map((c) => ({
    ...c,
    replies: all.filter((r) => r.parentId === c.id),
  }));
}

export async function toggleResolve(commentId: number, resolved: boolean) {
  await requireAuth();

  await db
    .update(comments)
    .set({ isResolved: resolved ? new Date() : null })
    .where(eq(comments.id, commentId));

  revalidatePath("/projects/[id]", "page");
}

export async function replyToComment(
  commentId: number,
  projectId: string,
  content: string,
) {
  const session = await requireAuth();

  const [reply] = await db
    .insert(comments)
    .values({
      projectId,
      authorName: session.user.name,
      content,
      timestamp: 0,
      parentId: commentId,
    })
    .returning();

  return reply;
}

// ─── Comments (Public / Client) ───

export async function createComment(formData: FormData) {
  const schema = z.object({
    projectId: z.string().uuid(),
    authorName: z.string().min(1, "Name is required"),
    content: z.string().min(1, "Comment is required"),
    timestamp: z.coerce.number().min(0),
  });

  const parsed = schema.parse({
    projectId: formData.get("projectId"),
    authorName: formData.get("authorName"),
    content: formData.get("content"),
    timestamp: formData.get("timestamp"),
  });

  const [project] = await db
    .select({ id: projects.id, shareToken: projects.shareToken })
    .from(projects)
    .where(eq(projects.id, parsed.projectId))
    .limit(1);

  if (!project) throw new Error("Project not found");

  const [comment] = await db
    .insert(comments)
    .values({
      projectId: parsed.projectId,
      authorName: parsed.authorName,
      content: parsed.content,
      timestamp: parsed.timestamp,
    })
    .returning();

  revalidatePath(`/v/${project.shareToken}`);
  return comment;
}

// ─── Profile ───

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export async function updateProfile(formData: FormData) {
  const session = await requireAuth();

  const parsed = updateProfileSchema.parse({
    name: formData.get("name"),
  });

  await db
    .update(user)
    .set({ name: parsed.name, updatedAt: new Date() })
    .where(eq(user.id, session.user.id));

  revalidatePath("/settings");
  return { success: true, name: parsed.name };
}
