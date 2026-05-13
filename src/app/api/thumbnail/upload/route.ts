import { NextRequest, NextResponse } from "next/server";
import {
  r2,
  R2_BUCKET,
  PutObjectCommand,
  GetObjectCommand,
  getSignedUrl,
} from "@/lib/r2";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

/** Presigned GET URLs for thumbnails are valid for 7 days (R2 limit) */
const THUMBNAIL_URL_EXPIRY = 60 * 60 * 24 * 7; // 7 days in seconds

export async function POST(request: NextRequest) {
  // Require auth (only editors can upload thumbnails)
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { projectId, imageBase64 } = await request.json();

    if (!projectId || !imageBase64) {
      return NextResponse.json(
        { error: "projectId and imageBase64 are required" },
        { status: 400 },
      );
    }

    // Decode the base64 image (accept both data URLs and raw base64)
    let rawBase64 = imageBase64;
    if (typeof rawBase64 === "string" && rawBase64.includes(",")) {
      rawBase64 = rawBase64.split(",")[1];
    }

    const imageBuffer = Buffer.from(rawBase64, "base64");

    // Validate that we got a non-empty buffer
    if (imageBuffer.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty image data" },
        { status: 400 },
      );
    }

    // Generate a unique key for the thumbnail
    const key = `thumbnails/${session.user.id}/${projectId}/${nanoid(8)}.jpg`;

    // Upload to R2
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: imageBuffer,
        ContentType: "image/jpeg",
      }),
    );

    // Generate a presigned GET URL valid for 30 days
    const thumbnailUrl = await getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      }),
      { expiresIn: THUMBNAIL_URL_EXPIRY },
    );

    return NextResponse.json({ thumbnailUrl });
  } catch (err) {
    console.error("Thumbnail upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload thumbnail" },
      { status: 500 },
    );
  }
}
