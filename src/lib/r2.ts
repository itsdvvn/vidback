import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let _r2: S3Client | null = null;

function getR2() {
  if (!_r2) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in .env",
      );
    }

    _r2 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return _r2;
}

/** Get or initialise the R2 S3 client */
export const r2 = getR2();

export const R2_BUCKET = process.env.R2_BUCKET || "vidback";

/** Ensure the bucket exists and has CORS configured — call once at startup */
export async function ensureBucket(): Promise<void> {
  try {
    await r2.send(new CreateBucketCommand({ Bucket: R2_BUCKET }));
    console.log(`[R2] Created bucket "${R2_BUCKET}"`);
  } catch (err: any) {
    // BucketAlreadyOwnedByYou / BucketAlreadyExists — no problem
    if (
      err.name === "BucketAlreadyOwnedByYou" ||
      err.name === "BucketAlreadyExists"
    ) {
      // bucket already exists, still set CORS
    } else {
      console.warn(
        `[R2] Could not create bucket "${R2_BUCKET}": ${err.message}`,
      );
      return;
    }
  }

  // Set CORS policy so browsers can upload directly to R2
  try {
    await r2.send(
      new PutBucketCorsCommand({
        Bucket: R2_BUCKET,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: ["*"],
              AllowedMethods: ["GET", "PUT", "POST", "HEAD"],
              AllowedHeaders: ["*"],
              ExposeHeaders: ["etag"],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      }),
    );
    console.log(`[R2] CORS configured for bucket "${R2_BUCKET}"`);
  } catch (err: any) {
    console.warn(`[R2] Could not set CORS: ${err.message}`);
  }
}

/**
 * Generate a fresh presigned GET URL for playback (valid 7 days).
 * Extracts the R2 key from a previous presigned URL, or uses the key directly.
 */
export async function refreshSignedUrl(keyOrUrl: string): Promise<string> {
  // If it looks like a full URL (contains a path /uploads/), extract the key
  const uploadsMatch = keyOrUrl.match(/\/uploads\/[^?]+/);
  const key = uploadsMatch ? uploadsMatch[0].replace(/^\//, "") : keyOrUrl;

  const url = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    }),
    { expiresIn: 60 * 60 * 24 * 7 }, // 7 days
  );
  return url;
}

export {
  PutObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  PutBucketCorsCommand,
};
export { getSignedUrl };
