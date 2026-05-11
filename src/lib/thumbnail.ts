// ─── Server-side imports (ffmpeg.wasm — pure WASM, no native binary) ───
// These are dynamically imported only when the server-side function is called,
// so client bundles never include the 31 MB WASM payload.
import type { FFmpeg } from "@ffmpeg/ffmpeg";

// ─── Types ───

/** Result of a server-side thumbnail capture */
export interface ThumbnailResult {
  /** JPEG image as a Node Buffer (ready for upload to R2 / S3) */
  buffer: Buffer;
  /** Width of the captured frame in pixels */
  width: number;
  /** Height of the captured frame in pixels */
  height: number;
}

// ─── Singleton FFmpeg loader (warm-starts reuse the same instance) ───

let _ffmpeg: FFmpeg | null = null;
let _ffmpegLoadPromise: Promise<FFmpeg> | null = null;

/**
 * Returns a loaded, ready-to-use FFmpeg instance.
 *
 * On the first call the WASM core (~31 MB) is fetched from jsDelivr CDN and
 * compiled.  Subsequent calls (warm Lambda invocations) reuse the cached
 * instance so you only pay the cold-start cost once.
 *
 * The CDN URL is used deliberately:
 *   - jsDelivr serves from a global edge network (fast everywhere).
 *   - Bundling the WASM inside the deployment would blow up the function zip
 *     and may hit Vercel's 50 MB unzipped limit on the Hobby plan.
 *   - For **Pro / Enterprise** you can copy the core files from
 *     `node_modules/@ffmpeg/core/dist/umd/` into `public/ffmpeg/` and switch
 *     the `baseURL` to a relative path (see comment below).
 */
async function _getFFmpeg(): Promise<FFmpeg> {
  if (_ffmpeg?.loaded) return _ffmpeg;

  // If another caller is already loading, wait for it
  if (_ffmpegLoadPromise) return _ffmpegLoadPromise;

  _ffmpegLoadPromise = (async () => {
    // Dynamic imports — these modules are never sent to the browser
    const { FFmpeg: FFmpegClass } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");

    const ffmpeg = new FFmpegClass();

    // ── Where the WASM core is loaded from ──
    // Option A (default): jsDelivr CDN — works everywhere, 31 MB download on
    //   first cold start. Good for Hobby / Pro plans.
    // Option B (recommended for production): copy `@ffmpeg/core` UMD files
    //   into `public/ffmpeg/` and serve from your own origin to avoid the
    //   external dependency.  Uncomment the lines below and comment out the
    //   CDN baseURL.
    const baseURL =
      "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";

    // Local bundling (uncomment for production):
    // const baseURL = "/ffmpeg";  // files in public/ffmpeg/

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm",
      ),
    });

    // Optional: log FFmpeg output for debugging
    // ffmpeg.on("log", ({ message }) => console.log("[ffmpeg]", message));

    return ffmpeg;
  })();

  try {
    _ffmpeg = await _ffmpegLoadPromise;
    return _ffmpeg;
  } finally {
    _ffmpegLoadPromise = null;
  }
}

// ─── Helpers ───

/** Format seconds to a `HH:MM:SS.xxx` timestamp string FFmpeg understands */
function _formatTimestamp(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = (totalSeconds % 60).toFixed(3);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(Number(s) < 10 ? "0" : "").padStart(2, "0")}${s}`;
}

// ─── Server-side thumbnail capture (ffmpeg.wasm) ───

/**
 * **Server-side** frame capture using ffmpeg.wasm.
 *
 * Fetches a video from a URL (e.g. an R2 presigned GET URL), extracts a
 * single JPEG frame at `timeSeconds`, and returns the image as a `Buffer`
 * together with its dimensions.
 *
 * This runs inside Next.js API routes, Route Handlers, or Server Actions.
 * It does **not** require a native ffmpeg binary — everything runs as WASM
 * in the Node.js runtime, which makes it compatible with Vercel, Neon, and
 * other serverless platforms.
 *
 * **Cold-start note:** the first invocation downloads & compiles ~31 MB of
 * WASM.  Warm invocations reuse the cached instance and are fast (~200 ms
 * for a typical 1080p frame extraction).
 *
 * @param videoUrl  Publicly-accessible URL of the source video.
 * @param timeSeconds  Timestamp (in seconds) to capture. Defaults to 1.0.
 * @returns A `ThumbnailResult` with the JPEG buffer and dimensions.
 *
 * @example
 * ```ts
 * // Inside an API route or Server Action
 * import { captureVideoFrameServer } from "@/lib/thumbnail";
 *
 * const { buffer, width, height } = await captureVideoFrameServer(
 *   "https://your-r2-bucket.r2.cloudflarestorage.com/uploads/abc/video.mp4?...",
 *   2.5,
 * );
 *
 * // Upload buffer directly to R2
 * await r2.send(new PutObjectCommand({
 *   Bucket: R2_BUCKET,
 *   Key: "thumbnails/proj_123/thumb.jpg",
 *   Body: buffer,
 *   ContentType: "image/jpeg",
 * }));
 * ```
 */
export async function captureVideoFrameServer(
  videoUrl: string,
  timeSeconds: number = 1,
): Promise<ThumbnailResult> {
  const ffmpeg = await _getFFmpeg();

  // Unique file names to avoid collisions between concurrent requests
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const inputFile = `input_${id}.mp4`;
  const outputFile = `thumb_${id}.jpg`;

  try {
    // 1. Fetch the video from the URL into ffmpeg's virtual filesystem
    const { fetchFile } = await import("@ffmpeg/util");
    const videoData = await fetchFile(videoUrl);
    await ffmpeg.writeFile(inputFile, videoData);

    // 2. Extract a single frame as JPEG
    //    -ss  : seek to timestamp (before -i for fast seeking)
    //    -vframes 1 : capture exactly one frame
    //    -q:v 3     : JPEG quality (2-31, lower = better, 2-5 is good)
    const timestamp = _formatTimestamp(timeSeconds);
    await ffmpeg.exec([
      "-ss",
      timestamp,
      "-i",
      inputFile,
      "-vframes",
      "1",
      "-q:v",
      "3",
      outputFile,
    ]);

    // 3. Read the JPEG back from the virtual filesystem
    const jpegData = await ffmpeg.readFile(outputFile);

    // 4. Peek at dimensions by re-reading with ffprobe (lightweight)
    let width = 0;
    let height = 0;
    try {
      await ffmpeg.ffprobe([
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height",
        "-of",
        "csv=p=0",
        inputFile,
        "-o",
        `meta_${id}.txt`,
      ]);
      const metaStr = (await ffmpeg.readFile(
        `meta_${id}.txt`,
        "utf8",
      )) as string;
      const parts = metaStr.trim().split(",");
      width = parseInt(parts[0], 10) || 0;
      height = parseInt(parts[1], 10) || 0;
      await ffmpeg.deleteFile(`meta_${id}.txt`).catch(() => {});
    } catch {
      // Dimensions are best-effort; the JPEG is still valid
    }

    // 5. Convert Uint8Array to Node Buffer for downstream consumers (R2 SDK, etc.)
    const buffer = Buffer.from(jpegData);

    return { buffer, width, height };
  } finally {
    // Always clean up the virtual filesystem to avoid leaking memory
    await ffmpeg.deleteFile(inputFile).catch(() => {});
    await ffmpeg.deleteFile(outputFile).catch(() => {});
  }
}

// ─── Convenience: generate + upload key ───

/**
 * One-shot: fetch a video, extract a frame, and return everything needed to
 * persist the thumbnail to R2 and update the database.
 *
 * This is the function you call from API routes or Server Actions when you
 * want the full pipeline without wiring the pieces together yourself.
 *
 * @returns The JPEG buffer, dimensions, and a ready-to-use R2 object key.
 */
export async function generateThumbnailFromVideo(
  videoUrl: string,
  userId: string,
  projectId: string,
  timeSeconds: number = 1,
): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
  /** R2 object key, e.g. `thumbnails/{userId}/{projectId}/{nanoid}.jpg` */
  key: string;
}> {
  const { nanoid } = await import("nanoid");
  const { buffer, width, height } = await captureVideoFrameServer(
    videoUrl,
    timeSeconds,
  );
  const key = `thumbnails/${userId}/${projectId}/${nanoid(8)}.jpg`;
  return { buffer, width, height, key };
}

// ─── Client-side thumbnail capture (browser <video> + <canvas>) ───

/**
 * Captures a frame from a video at the given time.
 *
 * This runs on the **client side** — it creates a hidden <video> element,
 * seeks to `timeSeconds`, draws the frame onto a <canvas>, and returns
 * the result as a JPEG Blob.
 *
 * @param videoUrl  URL of the video (must be accessible from the browser).
 * @param timeSeconds  Optional time offset in seconds (defaults to 1).
 * @returns A Promise that resolves to a Blob of the captured JPEG frame.
 */
export async function captureVideoFrame(
  videoUrl: string,
  timeSeconds: number = 1,
): Promise<Blob> {
  // Create a hidden video element
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.preload = "metadata";
  video.src = videoUrl;
  video.muted = true;
  video.playsInline = true;
  video.style.display = "none";
  document.body.appendChild(video);

  try {
    // Wait for enough metadata to be loaded so we can seek
    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => {
        video.removeEventListener("loadedmetadata", onLoaded);
        video.removeEventListener("error", onError);
        resolve();
      };
      const onError = () => {
        video.removeEventListener("loadedmetadata", onLoaded);
        video.removeEventListener("error", onError);
        reject(new Error("Failed to load video metadata"));
      };
      video.addEventListener("loadedmetadata", onLoaded);
      video.addEventListener("error", onError);

      // If the video is already ready, resolve immediately
      if (video.readyState >= 1) {
        video.removeEventListener("loadedmetadata", onLoaded);
        video.removeEventListener("error", onError);
        resolve();
      }
    });

    // Clamp timeSeconds to be within the video duration
    const safeTime = Math.min(
      Math.max(timeSeconds, 0),
      video.duration || Number.MAX_SAFE_INTEGER,
    );

    // Seek to the desired time
    video.currentTime = safeTime;

    // Wait for the seeked event
    await new Promise<void>((resolve, reject) => {
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        video.removeEventListener("error", onError);
        resolve();
      };
      const onError = () => {
        video.removeEventListener("seeked", onSeeked);
        video.removeEventListener("error", onError);
        reject(new Error("Failed to seek video"));
      };
      video.addEventListener("seeked", onSeeked);
      video.addEventListener("error", onError);

      // If the video is already at the right time, resolve immediately
      if (Math.abs(video.currentTime - safeTime) < 0.01) {
        video.removeEventListener("seeked", onSeeked);
        video.removeEventListener("error", onError);
        resolve();
      }
    });

    // Create a canvas and draw the current video frame
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context from canvas");
    }
    ctx.drawImage(video, 0, 0);

    // Convert the canvas to a JPEG blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) {
            resolve(b);
          } else {
            reject(new Error("Failed to create blob from canvas"));
          }
        },
        "image/jpeg",
        0.85,
      );
    });

    return blob;
  } finally {
    // Clean up the video element
    video.remove();
  }
}
