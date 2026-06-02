"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  useVideoPlayerState,
  useVideoPlayerActions,
} from "./VideoPlayerProvider";
import { CustomTimeline } from "./CustomTimeline";
import { PlaybackControls } from "./PlaybackControls";
import {
  AnnotationCanvasV2,
  AnnotationShape,
} from "@/components/comments/AnnotationCanvasV2";
import { Stage, Layer } from "react-konva";
import { cn } from "@/lib/utils";
import { AlertTriangle, Loader } from "lucide-react";
import type { Comment } from "@/types";
import type { Annotation } from "./VideoPlayerProvider";

export interface VideoPlayerProps {
  src: string;
  className?: string;
  showCommentButton?: boolean;
  /** Comments for timeline markers — synced into the player provider */
  comments?: Comment[];
}

export function VideoPlayer({
  src,
  className,
  showCommentButton = false,
  comments,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoBoxRef = useRef<HTMLDivElement>(null);
  const [overlaySize, setOverlaySize] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const {
    isCommenting,
    frozenTimestamp,
    isAnnotationMode,
    activeAnnotation,
    isPlaying,
    currentTime,
  } = useVideoPlayerState();
  const {
    setDuration,
    setCurrentTime,
    setIsPlaying,
    registerVideoRef,
    setComments,
    finishAnnotation,
    cancelAnnotation,
    showAnnotation,
  } = useVideoPlayerActions();

  // Sync comments into the provider so CustomTimeline shows markers
  useEffect(() => {
    if (comments) {
      setComments(comments);
    }
  }, [comments, setComments]);
  const retriesRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<
    "loading" | "processing" | "error" | "ready"
  >("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [aspectClass, setAspectClass] = useState<string>("aspect-video");

  const detectAspectRatio = useCallback((video: HTMLVideoElement) => {
    if (video.videoWidth && video.videoHeight) {
      if (video.videoHeight > video.videoWidth) {
        setAspectClass("aspect-[9/16] max-h-[70vh] mx-auto");
      } else {
        setAspectClass("aspect-video");
      }
    }
  }, []);

  // Track previous src to reset retries only on actual src changes
  const prevSrcRef = useRef(src);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    // Reset retry counter and timer only when the video source actually changes
    if (prevSrcRef.current !== src) {
      retriesRef.current = 0;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      prevSrcRef.current = src;
    }

    const onLoadedMetadata = () => {
      setDuration(el.duration);
      setStatus("ready");
      detectAspectRatio(el);
      registerVideoRef(el);
    };

    const onTimeUpdate = () => {
      setCurrentTime(el.currentTime);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    const onError = () => {
      if (retriesRef.current < 5) {
        // Transition to processing state and retry after 2s
        setStatus("processing");
        retryTimerRef.current = setTimeout(() => {
          retriesRef.current += 1;
          setStatus("loading");
          setErrorMessage("");
          if (videoRef.current) {
            videoRef.current.load();
          }
        }, 2000);
        return;
      }

      const mediaError = el.error;
      let msg = "Failed to load video.";
      if (mediaError) {
        switch (mediaError.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            msg = "Video loading aborted.";
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            msg = "Network error while loading video.";
            break;
          case MediaError.MEDIA_ERR_DECODE:
            msg = "Video decoding failed. The format may be unsupported.";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            msg = "Video format not supported by this browser.";
            break;
        }
      }
      setErrorMessage(msg);
      setStatus("error");
    };

    el.addEventListener("loadedmetadata", onLoadedMetadata);
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("error", onError);

    if (el.readyState >= 1) {
      onLoadedMetadata();
    }

    return () => {
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("error", onError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    src,
    setDuration,
    setCurrentTime,
    setIsPlaying,
    detectAspectRatio,
    registerVideoRef,
  ]);

  // Clear annotation overlay when video starts playing or user seeks
  const wasPlayingRef = useRef(false);
  const lastTimeRef = useRef(currentTime);
  useEffect(() => {
    const startedPlaying = isPlaying && !wasPlayingRef.current;
    const didSeek =
      !startedPlaying && Math.abs(currentTime - lastTimeRef.current) > 0.5;
    wasPlayingRef.current = isPlaying;
    lastTimeRef.current = currentTime;

    if (activeAnnotation && (startedPlaying || didSeek)) {
      showAnnotation(null);
    }
  }, [isPlaying, currentTime, activeAnnotation, showAnnotation]);

  // Cleanup retry timer on unmount
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  // Measure container size for annotation overlays (drawing + saved display)
  // Always active so overlaySize is available when clicking saved comments.
  useEffect(() => {
    const update = () => {
      const box = videoBoxRef.current;
      if (!box) return;
      const w = box.clientWidth;
      const h = box.clientHeight;
      if (w > 0 && h > 0) setOverlaySize({ w, h });
    };
    update();
    const ro = new ResizeObserver(update);
    const box = videoBoxRef.current;
    if (box) ro.observe(box);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={cn("group relative w-full", className)}>
      {/* Loading overlay */}
      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 rounded-xl">
          <div className="flex flex-col items-center gap-3 text-white">
            <Loader className="h-8 w-8 animate-spin" />
            <span className="text-sm font-medium">Loading video…</span>
          </div>
        </div>
      )}

      {/* Processing overlay */}
      {status === "processing" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 rounded-xl">
          <div className="flex flex-col items-center gap-3 text-white">
            <Loader className="h-8 w-8 animate-pulse" />
            <span className="text-sm font-medium">Processing video…</span>
            <span className="text-xs text-white/60">
              This may take a few seconds
            </span>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {status === "error" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 rounded-xl">
          <div className="flex flex-col items-center gap-3 text-white max-w-xs text-center">
            <AlertTriangle className="h-10 w-10 text-red-400" />
            <p className="text-sm">{errorMessage}</p>
            <button
              onClick={() => {
                setStatus("loading");
                setErrorMessage("");
                if (videoRef.current) {
                  videoRef.current.load();
                }
              }}
              className="mt-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Comment mode overlay banner */}
      {isCommenting && (
        <div className="absolute top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground shadow-lg">
          Add Comment — Time: {frozenTimestamp?.toFixed(1)}s
        </div>
      )}

      <div ref={videoBoxRef} className="relative">
        <video
          ref={videoRef}
          src={src}
          className={cn(
            "w-full rounded-t-xl bg-black object-contain",
            aspectClass,
          )}
          preload="metadata"
          playsInline
          controls={false}
        />

        {/* Annotation canvas overlay */}
        {isAnnotationMode && overlaySize && (
          <AnnotationCanvasV2
            width={overlaySize.w}
            height={overlaySize.h}
            onSave={(anns: Annotation[]) => finishAnnotation(anns)}
            onCancel={() => cancelAnnotation()}
            className="absolute inset-0 z-10"
            style={{ position: "absolute", left: 0, top: 0 }}
          />
        )}

        {/* Read-only annotation overlay for saved comments */}
        {activeAnnotation && activeAnnotation.length > 0 && overlaySize && (
          <Stage
            width={overlaySize.w}
            height={overlaySize.h}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              pointerEvents: "none",
            }}
          >
            <Layer>
              {activeAnnotation.map((ann, i) => (
                <AnnotationShape key={i} annotation={ann} />
              ))}
            </Layer>
          </Stage>
        )}
      </div>

      <PlaybackControls showCommentButton={showCommentButton} />
      <CustomTimeline />
    </div>
  );
}
