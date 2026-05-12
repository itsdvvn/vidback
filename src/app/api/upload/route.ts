import { NextResponse } from "next/server";
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

/** Presigned GET URLs are valid for 7 days */
const GET_URL_EXPIRY = 60 * 60 * 24 * 7; // 7 days in seconds

export async function POST(request: Request) {
  // Require auth (only editors can upload)
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { filename, contentType } = await request.json();

  if (!filename || !contentType) {
    return NextResponse.json(
      { error: "filename and contentType are required" },
      { status: 400 },
    );
  }

  // Sanitize the filename and create a unique key
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `uploads/${session.user.id}/${nanoid(8)}-${safeName}`;

  try {
    // Presigned URL for uploading (10 min)
    const presignedPutUrl = await getSignedUrl(
      r2,
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        ContentType: contentType,
      }),
      {
        expiresIn: 600,
        signableHeaders: new Set(["content-type"]),
      },
    );

    // Presigned URL for playback (7 days) — used as the videoUrl
    const presignedGetUrl = await getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      }),
      { expiresIn: GET_URL_EXPIRY },
    );

    return NextResponse.json({
      presignedPutUrl,
      presignedGetUrl,
      key,
    });
  } catch (err) {
    console.error("R2 upload error:", err);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}
