import { NextResponse } from "next/server";
import { r2, R2_BUCKET, ensureBucket } from "@/lib/r2";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * One-time setup: configures the R2 bucket (creation, CORS).
 * Visit this URL once in the browser after deployment.
 *
 * GET /api/r2/setup
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return new Response("Not authenticated — you must be logged in.", { status: 401 });
  }

  try {
    console.log("[R2 setup] Starting bucket setup…");
    await ensureBucket();
    console.log("[R2 setup] ✓ Complete");

    return new Response(
      `R2 bucket "${R2_BUCKET}" is ready.\n\nCORS is configured — file uploads from the browser should now work.\nYou can close this tab.`,
      { status: 200 },
    );
  } catch (err: any) {
    console.error("[R2 setup] Failed:", err);
    return new Response(`Setup failed: ${err.message}`, { status: 500 });
  }
}
