import { NextResponse } from "next/server";
import { db } from "@/db";
import { comments } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 },
      );
    }

    const normalized = email.trim().toLowerCase();

    // Check if any comment was made with this name (placeholder for future email column)
    const rows = await db
      .select({ authorName: comments.authorName })
      .from(comments)
      .where(eq(comments.authorName, normalized))
      .limit(1);

    if (rows.length > 0 && rows[0].authorName) {
      return NextResponse.json({ found: true, name: rows[0].authorName });
    }

    return NextResponse.json({ found: false });
  } catch (error) {
    console.error("Client check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
