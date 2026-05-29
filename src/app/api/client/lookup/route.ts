import { NextResponse } from "next/server";
import { db } from "@/db";
import { clientProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email) {
    return NextResponse.json({ found: false });
  }

  const [profile] = await db
    .select()
    .from(clientProfiles)
    .where(eq(clientProfiles.email, email.toLowerCase()))
    .limit(1);

  return NextResponse.json(
    profile ? { found: true, name: profile.name } : { found: false },
  );
}
