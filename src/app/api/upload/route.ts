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

const GET_URL_EXPIRY = 60 * 60 * 24 * 7; // 7 days

/**
 * Generate presigned URLs for uploading directly to R2 from the browser.
 * Payload is tiny (JSON) — no 413 errors. The file itself goes from
 * the browser straight to R2 via the presigned PUT URL.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
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

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `uploads/${session.user.id}/${nanoid(8)}-${safeName}`;

  try {
    const presignedPutUrl = await getSignedUrl(
      r2,
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 600, signableHeaders: new Set(["content-type"]) },
    );

    const presignedGetUrl = await getSignedUrl(
      r2,
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
      { expiresIn: GET_URL_EXPIRY },
    );

    return NextResponse.json({ presignedPutUrl, presignedGetUrl, key });
  } catch (err) {
    console.error("[upload] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    );
  }
}
