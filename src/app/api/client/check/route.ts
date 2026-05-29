import { NextResponse } from "next/server";
import { db } from "@/db";
import { clientProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();

    const [profile] = await db
      .select()
      .from(clientProfiles)
      .where(eq(clientProfiles.email, normalized))
      .limit(1);

    if (profile) {
      return NextResponse.json({ found: true, name: profile.name });
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
