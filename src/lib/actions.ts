"use server";

import { db } from "@/db";
import { projects, comments, user } from "@/db/schema";
import { eq, and, isNull, count, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { r2, R2_BUCKET, DeleteObjectCommand } from "@/lib/r2";

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

const ADMIN_EMAIL = "swahyuinfo@gmail.com";
const MAX_USER_STORAGE = 500 * 1024 * 1024; // 500 MB
const MAX_VIDEOS_PER_USER = 3;
const MAX_USERS = 10;

/** Check if an email is the admin */
export async function isAdmin(email: string): Promise<boolean> {
  return email === ADMIN_EMAIL;
}

/** Get storage usage for the current user */
export async function getStorageUsage(): Promise<{
  usedBytes: number;
  limitBytes: number;
  usedVideos: number;
  maxVideos: number;
}> {
  const session = await requireAuth();

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.editorId, session.user.id));

  const usedBytes = userProjects.reduce(
    (acc, p) => acc + (p.storageBytes || 0),
    0,
  );
  const usedVideos = userProjects.length;
  const limitBytes =
    session.user.email === ADMIN_EMAIL ? Infinity : MAX_USER_STORAGE;
  const maxVideos =
    session.user.email === ADMIN_EMAIL ? Infinity : MAX_VIDEOS_PER_USER;

  return { usedBytes, limitBytes, usedVideos, maxVideos };
}

/** Get total user count (for landing page stats) */
export async function getUserCount(): Promise<{
  current: number;
  limit: number;
}> {
  const [result] = await db.select({ count: count() }).from(user);
  return { current: result?.count ?? 0, limit: MAX_USERS };
}

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  videoUrl: z.string().url("Must be a valid URL"),
  storageBytes: z.coerce.number().min(0).default(0),
});

export async function createProject(formData: FormData) {
  const session = await requireAuth();

  // 1. Check global user limit (non-admin only)
  if (session.user.email !== ADMIN_EMAIL) {
    const [userCount] = await db.select({ count: count() }).from(user);
    if ((userCount?.count ?? 0) >= MAX_USERS) {
      throw new Error("Beta is full! All " + MAX_USERS + " spots are taken.");
    }

    // 2. Check per-user video and storage limits
    const existingProjects = await db
      .select({ id: projects.id, storageBytes: projects.storageBytes })
      .from(projects)
      .where(eq(projects.editorId, session.user.id));

    if (existingProjects.length >= MAX_VIDEOS_PER_USER) {
      throw new Error(
        "You have reached the limit of " +
          MAX_VIDEOS_PER_USER +
          " projects. Contact the admin to upgrade.",
      );
    }

    // 3. Check per-user storage limit
    const used = existingProjects.reduce(
      (acc, p) => acc + (p.storageBytes || 0),
      0,
    );
    const newFileSize = Number(formData.get("storageBytes")) || 0;

    if (used + newFileSize > MAX_USER_STORAGE) {
      const usedMB = (used / (1024 * 1024)).toFixed(1);
      const limitMB = (MAX_USER_STORAGE / (1024 * 1024)).toFixed(0);
      throw new Error(
        `Storage limit exceeded! You have used ${usedMB} MB of ${limitMB} MB.`,
      );
    }
  }

  const parsed = createProjectSchema.parse({
    name: formData.get("name"),
    videoUrl: formData.get("videoUrl"),
    storageBytes: formData.get("storageBytes"),
  });

  const shareToken = `${nanoid(4)}-${nanoid(4)}-${nanoid(4)}`;
  const password = Math.random().toString(36).slice(2, 8);

  const [project] = await db
    .insert(projects)
    .values({
      name: parsed.name,
      videoUrl: parsed.videoUrl,
      shareToken,
      password,
      editorId: session.user.id,
      storageBytes: parsed.storageBytes,
    })
    .returning();

  revalidatePath("/dashboard");
  return { ...project, password };
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

  const [project] = await db
    .select({
      editorId: projects.editorId,
      videoUrl: projects.videoUrl,
      thumbnailUrl: projects.thumbnailUrl,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) throw new Error("Not found");
  if (project.editorId !== session.user.id) throw new Error("Forbidden");

  // Delete associated R2 media (best-effort)
  const mediaUrls = [project.videoUrl, project.thumbnailUrl].filter(
    Boolean,
  ) as string[];
  for (const url of mediaUrls) {
    try {
      const key = extractR2Key(url);
      if (key)
        await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    } catch {
      /* best-effort */
    }
  }

  await db.delete(projects).where(eq(projects.id, projectId));
  revalidatePath("/dashboard");
}

/** Extract the R2 object key from a presigned or public URL */
function extractR2Key(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && parts[0] === R2_BUCKET)
      return parts.slice(1).join("/");
    if (parts.length >= 1) return parts.join("/");
    return null;
  } catch {
    return null;
  }
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

  // Inherit the parent comment's timestamp so the reply seeks to the right time
  const [parent] = await db
    .select({ timestamp: comments.timestamp })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  const [reply] = await db
    .insert(comments)
    .values({
      projectId,
      authorName: session.user.name,
      content,
      timestamp: parent?.timestamp ?? 0,
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
    parentId: z.coerce.number().optional(),
  });

  const parsed = schema.parse({
    projectId: formData.get("projectId"),
    authorName: formData.get("authorName"),
    content: formData.get("content"),
    timestamp: formData.get("timestamp"),
    parentId: formData.get("parentId")
      ? Number(formData.get("parentId"))
      : undefined,
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
      parentId: parsed.parentId ?? null,
    })
    .returning();

  revalidatePath(`/v/${project.shareToken}`);
  return comment;
}

// ─── Thumbnail ───

export async function updateProjectThumbnail(
  projectId: string,
  thumbnailUrl: string,
) {
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
    .set({ thumbnailUrl, updatedAt: new Date() })
    .where(eq(projects.id, projectId));

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { success: true };
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

// ─── Notifications ───

export type Notification = {
  id: number;
  projectId: string;
  projectName: string;
  authorName: string;
  content: string;
  timestamp: number;
  isResolved: Date | null;
  createdAt: Date;
};

export async function getEditorNotifications(): Promise<Notification[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  const rows = await db
    .select({
      id: comments.id,
      projectId: comments.projectId,
      projectName: projects.name,
      authorName: comments.authorName,
      content: comments.content,
      timestamp: comments.timestamp,
      isResolved: comments.isResolved,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .innerJoin(projects, eq(comments.projectId, projects.id))
    .where(
      and(eq(projects.editorId, session.user.id), isNull(comments.parentId)),
    )
    .orderBy(desc(comments.createdAt))
    .limit(50);

  return rows;
}
