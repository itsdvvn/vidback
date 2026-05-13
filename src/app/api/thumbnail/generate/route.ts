import { NextResponse } from "next/server";
import {
  r2,
  R2_BUCKET,
  PutObjectCommand,
  GetObjectCommand,
  getSignedUrl,
} from "@/lib/r2";
import { captureVideoFrameServer } from "@/lib/thumbnail";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

/** Presigned GET URLs for thumbnails are valid for 7 days (R2 limit) */
const THUMBNAIL_URL_EXPIRY = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * POST /api/thumbnail/generate
 *
 * Generate a thumbnail server-side using ffmpeg.wasm.
 *
 * Body: `{ videoUrl: string, projectId: string, timeSeconds?: number }`
 *   - `videoUrl` — a presigned (or public) URL to the video file in R2.
 *   - `projectId` — the project to associate the thumbnail with.
 *   - `timeSeconds` — optional capture timestamp (default: 1.0).
 *
 * Returns: `{ thumbnailUrl: string, width: number, height: number }`
 *   where `thumbnailUrl` is a fresh presigned URL to the JPEG stored in R2.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { videoUrl, projectId, timeSeconds } = await request.json();

    if (!videoUrl || !projectId) {
      return NextResponse.json(
        { error: "videoUrl and projectId are required" },
        { status: 400 },
      );
    }

    // 1. Extract a frame from the video using ffmpeg.wasm (server-side)
    const { buffer, width, height } = await captureVideoFrameServer(
      videoUrl,
      typeof timeSeconds === "number" ? timeSeconds : 1,
    );

    // 2. Upload the JPEG to R2
    const key = `thumbnails/${session.user.id}/${projectId}/${nanoid(8)}.jpg`;

    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: "image/jpeg",
      }),
    );

    // 3. Generate a presigned GET URL for the thumbnail
    const thumbnailUrl = await getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      }),
      { expiresIn: THUMBNAIL_URL_EXPIRY },
    );

    return NextResponse.json({ thumbnailUrl, width, height });
  } catch (err) {
    console.error("[thumbnail/generate] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to generate thumbnail",
      },
      { status: 500 },
    );
  }
}
