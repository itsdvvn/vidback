import { NextResponse } from "next/server";
import {
  r2,
  R2_BUCKET,
  PutObjectCommand,
  GetObjectCommand,
  getSignedUrl,
  ensureBucket,
} from "@/lib/r2";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

/** Presigned GET URLs are valid for 7 days */
const GET_URL_EXPIRY = 60 * 60 * 24 * 7; // 7 days in seconds

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Ensure bucket exists + CORS is set (server-side, no browser CORS issues)
    await ensureBucket();

    // Accept the file as multipart/form-data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const filename =
      (formData.get("filename") as string) || file?.name || "video.mp4";
    const contentType =
      (formData.get("contentType") as string) || file?.type || "video/mp4";

    if (!file) {
      return NextResponse.json(
        {
          error: "No file provided. Send the file as FormData with key 'file'.",
        },
        { status: 400 },
      );
    }

    // Sanitize filename and create a unique R2 key
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `uploads/${session.user.id}/${nanoid(8)}-${safeName}`;

    // Upload the file buffer directly to R2 (server-side, no CORS needed)
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      }),
    );

    // Generate a presigned GET URL for playback (7 days)
    const videoUrl = await getSignedUrl(
      r2,
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
      { expiresIn: GET_URL_EXPIRY },
    );

    return NextResponse.json({ videoUrl, key });
  } catch (err) {
    console.error("[upload] Server-side upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    );
  }
}
