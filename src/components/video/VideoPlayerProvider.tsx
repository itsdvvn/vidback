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

export interface Annotation {
  type: "freehand" | "rectangle" | "circle" | "arrow";
  /** Absolute pixel coordinates within the annotation canvas */
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
}

interface VideoPlayerState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  comments: Comment[];
  isCommenting: boolean;
  frozenTimestamp: number | null;
  /** Whether the annotation drawing mode is active */
  isAnnotationMode: boolean;
  /** Annotation data received from the canvas after save */
  annotationResult: Annotation[] | null;
  /** Annotation overlay shown on the video when a saved comment is clicked */
  activeAnnotation: Annotation[] | null;
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
  /** Enter annotation drawing mode */
  startAnnotation: () => void;
  /** Exit annotation mode without saving */
  cancelAnnotation: () => void;
  /** Save annotations and exit mode */
  finishAnnotation: (annotations: Annotation[]) => void;
  /** Show saved annotation overlay on the video */
  showAnnotation: (annotations: Annotation[] | null) => void;
  /** Seek to a timestamp and mark it as annotation-triggered */
  seekToAnnotation: (time: number) => void;
  /** Check and clear the annotation seek flag */
  consumeAnnotationSeek: () => boolean;
  /** Sync live strokes from AnnotationCanvasV2 (auto-save on submit) */
  syncAnnotationStrokes: (strokes: Annotation[]) => void;
  /** Read and return current live strokes */
  getLiveAnnotationStrokes: () => Annotation[];
}

const StateContext = createContext<VideoPlayerState | null>(null);
const ActionsContext = createContext<VideoPlayerActions | null>(null);

export function VideoPlayerProvider({ children }: { children: ReactNode }) {
  // Store the actual video element in a ref
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const annotationSeekRef = useRef(false);
  const liveAnnotationStrokesRef = useRef<Annotation[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isCommenting, setIsCommenting] = useState(false);
  const [frozenTimestamp, setFrozenTimestamp] = useState<number | null>(null);
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [annotationResult, setAnnotationResult] = useState<Annotation[] | null>(
    null,
  );
  const [activeAnnotation, setActiveAnnotation] = useState<Annotation[] | null>(
    null,
  );

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

  const seek = useCallback(
    (time: number) => {
      const el = getVideo();
      if (!el) return;
      el.currentTime = Math.max(0, Math.min(time, el.duration || 0));
      setCurrentTime(el.currentTime);
    },
    [getVideo],
  );

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

  const startAnnotation = useCallback(() => {
    setAnnotationResult(null);
    setIsAnnotationMode(true);
  }, []);

  const cancelAnnotation = useCallback(() => {
    setIsAnnotationMode(false);
    setAnnotationResult(null);
  }, []);

  const finishAnnotation = useCallback((annotations: Annotation[]) => {
    setAnnotationResult(annotations);
    setIsAnnotationMode(false);
  }, []);

  const showAnnotation = useCallback((annotations: Annotation[] | null) => {
    setActiveAnnotation(annotations);
  }, []);

  const state: VideoPlayerState = {
    currentTime,
    duration,
    isPlaying,
    comments,
    isCommenting,
    frozenTimestamp,
    isAnnotationMode,
    annotationResult,
    activeAnnotation,
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
    startAnnotation,
    cancelAnnotation,
    finishAnnotation,
    showAnnotation,
    /** Seek to a timestamp and mark it as triggered by an annotation click */
    seekToAnnotation: (time: number) => {
      annotationSeekRef.current = true;
      seek(time);
    },
    /** Check and clear the annotation seek flag */
    consumeAnnotationSeek: () => {
      const val = annotationSeekRef.current;
      annotationSeekRef.current = false;
      return val;
    },
    /** Sync live strokes from AnnotationCanvasV2 */
    syncAnnotationStrokes: (strokes: Annotation[]) => {
      liveAnnotationStrokesRef.current = strokes;
    },
    /** Read current live strokes (used by CommentInput on submit) */
    getLiveAnnotationStrokes: () => liveAnnotationStrokesRef.current,
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
    throw new Error(
      "useVideoPlayerState must be used within VideoPlayerProvider",
    );
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
