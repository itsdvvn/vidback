import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const ADMIN_EMAIL = "swahyuinfo@gmail.com";
const MAX_USER_STORAGE = 500 * 1024 * 1024; // 500 MB
const MAX_VIDEOS_PER_USER = 3;

/**
 * Returns storage/video usage for the authenticated user.
 * Called by the dashboard sidebar to populate the StorageBar component.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

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

  return NextResponse.json({ usedBytes, limitBytes, usedVideos, maxVideos });
}
