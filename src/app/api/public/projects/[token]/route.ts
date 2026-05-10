import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, comments } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.shareToken, token))
    .limit(1);

  if (!project) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 },
    );
  }

  const allComments = await db
    .select()
    .from(comments)
    .where(eq(comments.projectId, project.id))
    .orderBy(comments.timestamp);

  const topLevel = allComments.filter((c) => c.parentId === null);
  const threaded = topLevel.map((c) => ({
    ...c,
    replies: allComments.filter((r) => r.parentId === c.id),
  }));

  return NextResponse.json({ project, comments: threaded });
}
