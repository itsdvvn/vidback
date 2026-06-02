import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  PutBucketCorsCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { FetchHttpHandler } from "@smithy/fetch-http-handler";
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
      requestHandler: new FetchHttpHandler(),
    });
  }
  return _r2;
}

/**
 * Lazy R2 S3 client proxy.
 * Defers initialization until the first actual method call,
 * so importing this module never throws at build time.
 */
function createLazyR2(): S3Client {
  const handler: ProxyHandler<S3Client> = {
    get(_target, prop: string | symbol) {
      const client = getR2();
      const value = (client as any)[prop];
      return typeof value === "function" ? value.bind(client) : value;
    },
  };
  return new Proxy({} as S3Client, handler);
}

export const r2 = createLazyR2();

export const R2_BUCKET = process.env.R2_BUCKET || "vidback";

/** Ensure the bucket exists and CORS is configured */
export async function ensureBucket(): Promise<void> {
  try {
    await r2.send(new CreateBucketCommand({ Bucket: R2_BUCKET }));
    console.log(`[R2] Bucket "${R2_BUCKET}" ready`);
  } catch {
    /* exists */
  }

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
    console.log(`[R2] CORS configured for "${R2_BUCKET}"`);
  } catch (e: any) {
    console.error(`[R2] CORS configuration failed: ${e.message}`);
  }
}

/**
 * Generate a fresh presigned GET URL for playback (valid 7 days).
 * Extracts the R2 key from a previous presigned URL, or uses the key directly.
 */
export async function refreshSignedUrl(keyOrUrl: string): Promise<string> {
  const uploadsMatch = keyOrUrl.match(/\/uploads\/[^?]+/);
  const key = uploadsMatch ? uploadsMatch[0].replace(/^\//, "") : keyOrUrl;

  const url = await getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    { expiresIn: 60 * 60 * 24 * 7 },
  );
  return url;
}

export {
  PutObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  PutBucketCorsCommand,
  DeleteObjectCommand,
};
export { getSignedUrl };
