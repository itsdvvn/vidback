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
  /** Whether the Add Comment mode is active (timestamp frozen) */
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
  /** Enter comment mode — pauses video & captures timestamp */
  startComment: () => void;
  cancelComment: () => void;
  setComments: (comments: Comment[]) => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
}

const StateContext = createContext<VideoPlayerState | null>(null);
const ActionsContext = createContext<VideoPlayerActions | null>(null);

export function VideoPlayerProvider({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isCommenting, setIsCommenting] = useState(false);
  const [frozenTimestamp, setFrozenTimestamp] = useState<number | null>(null);

  const play = useCallback(() => {
    videoRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(time, videoRef.current.duration || 0));
    setCurrentTime(videoRef.current.currentTime);
  }, []);

  const rewind10 = useCallback(() => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, videoRef.current.currentTime - 10);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  const forward10 = useCallback(() => {
    if (!videoRef.current) return;
    const newTime = Math.min(
      videoRef.current.duration || 0,
      videoRef.current.currentTime + 10,
    );
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  const startComment = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    setIsPlaying(false);
    const timestamp = videoRef.current.currentTime;
    setFrozenTimestamp(timestamp);
    setIsCommenting(true);
  }, []);

  const cancelComment = useCallback(() => {
    setIsCommenting(false);
    setFrozenTimestamp(null);
  }, []);

  // Expose videoRef via a getter so children can attach it
  const getVideoRef = useCallback(() => videoRef, []);

  const state: VideoPlayerState & { _videoRef: typeof videoRef } = {
    currentTime,
    duration,
    isPlaying,
    comments,
    isCommenting,
    frozenTimestamp,
    _videoRef: videoRef,
  };

  const actions: VideoPlayerActions & { getVideoRef: () => typeof videoRef } =
    {
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
      getVideoRef,
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
