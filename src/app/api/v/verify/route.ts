import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const { shareToken, password } = await request.json();

  const [project] = await db
    .select({ password: projects.password, id: projects.id })
    .from(projects)
    .where(eq(projects.shareToken, shareToken))
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // If no password is set (legacy projects), allow access
  if (!project.password || project.password === password) {
    return NextResponse.json({ valid: true });
  }

  return NextResponse.json({ valid: false });
}
