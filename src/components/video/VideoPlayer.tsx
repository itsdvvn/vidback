"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  useVideoPlayerState,
  useVideoPlayerActions,
} from "./VideoPlayerProvider";
import { CustomTimeline } from "./CustomTimeline";
import { PlaybackControls } from "./PlaybackControls";
import { cn } from "@/lib/utils";
import { AlertTriangle, Loader } from "lucide-react";
import type { Comment } from "@/types";

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
  const { isCommenting, frozenTimestamp } = useVideoPlayerState();
  const {
    setDuration,
    setCurrentTime,
    setIsPlaying,
    registerVideoRef,
    setComments,
  } = useVideoPlayerActions();

  // Sync comments into the provider so CustomTimeline shows markers
  useEffect(() => {
    if (comments) {
      setComments(comments);
    }
  }, [comments, setComments]);
  const [status, setStatus] = useState<"loading" | "error" | "ready">(
    "loading",
  );
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

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

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
  }, [
    setDuration,
    setCurrentTime,
    setIsPlaying,
    detectAspectRatio,
    registerVideoRef,
  ]);

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
        <div className="absolute top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white shadow-lg">
          Add Comment — Time: {frozenTimestamp?.toFixed(1)}s
        </div>
      )}

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

      <PlaybackControls showCommentButton={showCommentButton} />
      <CustomTimeline />
    </div>
  );
}
