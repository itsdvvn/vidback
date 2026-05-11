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
