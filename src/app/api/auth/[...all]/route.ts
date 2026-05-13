import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const handler = toNextJsHandler(auth);

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Rate limit auth endpoints: 10 attempts per IP per minute
  if (!checkRateLimit(`auth:${ip}`, 10, 60000)) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 },
    );
  }

  return handler.POST(request);
}

export async function GET(request: NextRequest) {
  return handler.GET(request);
}
