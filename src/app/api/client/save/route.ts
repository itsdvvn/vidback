import { NextResponse } from "next/server";
import { db } from "@/db";
import { clientProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const { email, name } = await request.json();
  if (!email || !name) {
    return NextResponse.json({ error: "email and name required" }, { status: 400 });
  }

  // Upsert: insert or update
  await db
    .insert(clientProfiles)
    .values({ email: email.toLowerCase(), name })
    .onConflictDoUpdate({ target: clientProfiles.email, set: { name } });

  return NextResponse.json({ success: true });
}
