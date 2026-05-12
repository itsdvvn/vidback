import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { count } from "drizzle-orm";

/**
 * Public endpoint that returns the current user count and limit.
 * Used by the signup page to check if there are available slots.
 */
export async function GET() {
  const [result] = await db.select({ count: count() }).from(user);
  return NextResponse.json({
    current: result?.count ?? 0,
    limit: 10,
  });
}
