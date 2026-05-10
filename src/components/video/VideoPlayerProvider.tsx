"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Comment } from "@/types";

interface VideoPlayerState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  comments: Comment[];
  isCommenting: boolean;
  frozenTimestamp: number | null;
}

interface VideoPlayerActions {
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  rewind10: () => void;
  forward10: () => void;
  startComment: () => void;
  cancelComment: () => void;
  setComments: (comments: Comment[]) => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  /** Called by VideoPlayer to connect the real <video> element */
  registerVideoRef: (el: HTMLVideoElement | null) => void;
}

const StateContext = createContext<VideoPlayerState | null>(null);
const ActionsContext = createContext<VideoPlayerActions | null>(null);

export function VideoPlayerProvider({ children }: { children: ReactNode }) {
  // Store the actual video element in a ref
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isCommenting, setIsCommenting] = useState(false);
  const [frozenTimestamp, setFrozenTimestamp] = useState<number | null>(null);

  // Called by VideoPlayer on mount to connect the real element
  const registerVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoElRef.current = el;
  }, []);

  const getVideo = useCallback(() => videoElRef.current, []);

  const play = useCallback(() => {
    getVideo()?.play();
  }, [getVideo]);

  const pause = useCallback(() => {
    getVideo()?.pause();
  }, [getVideo]);

  const togglePlay = useCallback(() => {
    const el = getVideo();
    if (!el) return;
    if (el.paused) {
      el.play();
    } else {
      el.pause();
    }
  }, [getVideo]);

  const seek = useCallback((time: number) => {
    const el = getVideo();
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(time, el.duration || 0));
    setCurrentTime(el.currentTime);
  }, [getVideo]);

  const rewind10 = useCallback(() => {
    const el = getVideo();
    if (!el) return;
    el.currentTime = Math.max(0, el.currentTime - 10);
    setCurrentTime(el.currentTime);
  }, [getVideo]);

  const forward10 = useCallback(() => {
    const el = getVideo();
    if (!el) return;
    el.currentTime = Math.min(el.duration || 0, el.currentTime + 10);
    setCurrentTime(el.currentTime);
  }, [getVideo]);

  const startComment = useCallback(() => {
    const el = getVideo();
    if (!el) return;
    el.pause();
    setIsPlaying(false);
    setFrozenTimestamp(el.currentTime);
    setIsCommenting(true);
  }, [getVideo]);

  const cancelComment = useCallback(() => {
    setIsCommenting(false);
    setFrozenTimestamp(null);
  }, []);

  const state: VideoPlayerState = {
    currentTime,
    duration,
    isPlaying,
    comments,
    isCommenting,
    frozenTimestamp,
  };

  const actions: VideoPlayerActions = {
    play,
    pause,
    togglePlay,
    seek,
    rewind10,
    forward10,
    startComment,
    cancelComment,
    setComments,
    setDuration,
    setCurrentTime,
    setIsPlaying,
    registerVideoRef,
  };

  return (
    <StateContext.Provider value={state}>
      <ActionsContext.Provider value={actions}>
        {children}
      </ActionsContext.Provider>
    </StateContext.Provider>
  );
}

export function useVideoPlayerState() {
  const ctx = useContext(StateContext);
  if (!ctx)
    throw new Error("useVideoPlayerState must be used within VideoPlayerProvider");
  return ctx;
}

export function useVideoPlayerActions() {
  const ctx = useContext(ActionsContext);
  if (!ctx)
    throw new Error(
      "useVideoPlayerActions must be used within VideoPlayerProvider",
    );
  return ctx;
}
