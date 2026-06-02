"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type CSSProperties,
} from "react";
import { Stage, Layer, Line, Rect, Ellipse, Arrow } from "react-konva";
import type { Annotation } from "@/components/video/VideoPlayerProvider";
import { useVideoPlayerActions } from "@/components/video/VideoPlayerProvider";
import { cn } from "@/lib/utils";
import {
  X,
  Undo2,
  Trash2,
  Paintbrush,
  Square,
  Circle,
  ArrowUp,
} from "lucide-react";

interface AnnotationCanvasV2Props {
  width: number;
  height: number;
  onCancel: () => void;
  className?: string;
  style?: CSSProperties;
}

const COLORS = [
  "#eab308",
  "#ff0000",
  "#ffa500",
  "#00ff00",
  "#00bfff",
  "#ff00ff",
  "#ffffff",
];
const DEFAULT_COLOR = "#eab308";

type ToolType = Annotation["type"];

export function AnnotationCanvasV2({
  width,
  height,
  onCancel,
  className,
  style,
}: AnnotationCanvasV2Props) {
  const { syncAnnotationStrokes } = useVideoPlayerActions();
  const [tool, setTool] = useState<ToolType>("freehand");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const strokeWidth = 3;

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentPoints, setCurrentPoints] = useState<
    { x: number; y: number }[]
  >([]);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<{ x: number; y: number }[]>([]);
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback((e: any) => {
    if (e.target !== e.target.getStage()) return;
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    isDrawingRef.current = true;
    shapeStartRef.current = { x: pos.x, y: pos.y };
    currentPointsRef.current = [{ x: pos.x, y: pos.y }];
    setCurrentPoints([{ x: pos.x, y: pos.y }]);
  }, []);

  const handlePointerMove = useCallback(
    (e: any) => {
      if (!isDrawingRef.current) return;
      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;

      if (tool === "freehand") {
        currentPointsRef.current = [
          ...currentPointsRef.current,
          { x: pos.x, y: pos.y },
        ];
        setCurrentPoints([...currentPointsRef.current]);
      } else {
        const start = shapeStartRef.current;
        if (start) {
          currentPointsRef.current = [start, { x: pos.x, y: pos.y }];
          setCurrentPoints([start, { x: pos.x, y: pos.y }]);
        }
      }
    },
    [tool],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const points = currentPointsRef.current;
    currentPointsRef.current = [];
    shapeStartRef.current = null;

    if (points.length > 0) {
      if (tool !== "freehand" && points.length < 2) return;
      setAnnotations((prev) => [
        ...prev,
        {
          type: tool,
          points: points.map((p) => ({ x: p.x, y: p.y })),
          color,
          strokeWidth,
        },
      ]);
    }
    setCurrentPoints([]);
  }, [tool, color]);

  // Sync strokes to provider for auto-save on form submit
  useEffect(() => {
    syncAnnotationStrokes(annotations);
  }, [annotations, syncAnnotationStrokes]);

  const undo = () => setAnnotations((prev) => prev.slice(0, -1));
  const clearAll = () => setAnnotations([]);
  const hasStrokes = annotations.length > 0;

  return (
    <div className={cn("relative", className)} style={style}>
      {/* Hint bar */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 shadow-lg pointer-events-none">
        <Paintbrush className="h-3 w-3 text-yellow-400" />
        <span className="text-[10px] font-medium text-white/80">
          Notebrush active — submit or cancel in the comment form
        </span>
      </div>

      {/* Close button */}
      <button
        onMouseDown={(e) => {
          e.stopPropagation();
          onCancel();
        }}
        className="absolute top-1 right-1 z-30 rounded-full bg-black/60 p-1 text-white/70 hover:text-white hover:bg-black/80 transition-colors"
        title="Close notebrush"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Toolbar */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-lg bg-black/80 px-2 py-1.5 shadow-lg">
        <span className="text-[10px] font-medium text-white/50 mr-1 uppercase tracking-wider">
          Brush
        </span>
        {(
          [
            {
              type: "freehand" as ToolType,
              icon: Paintbrush,
              label: "Freehand",
            },
            { type: "rectangle" as ToolType, icon: Square, label: "Rectangle" },
            { type: "circle" as ToolType, icon: Circle, label: "Circle" },
            { type: "arrow" as ToolType, icon: ArrowUp, label: "Arrow" },
          ] as const
        ).map((t) => (
          <button
            key={t.type}
            title={t.label}
            onMouseDown={(e) => {
              e.stopPropagation();
              setTool(t.type);
            }}
            className={cn(
              "rounded p-1.5 transition-colors",
              tool === t.type
                ? "bg-white/20 text-white"
                : "text-white/60 hover:text-white hover:bg-white/10",
            )}
          >
            <t.icon className="h-4 w-4" />
          </button>
        ))}
        <div className="w-px h-5 bg-white/20 mx-1" />
        {COLORS.map((c) => (
          <button
            key={c}
            onMouseDown={(e) => {
              e.stopPropagation();
              setColor(c);
            }}
            className={cn(
              "h-5 w-5 rounded-full border-2 transition-all",
              color === c ? "border-white scale-110" : "border-transparent",
            )}
            style={{ backgroundColor: c }}
          />
        ))}
        <div className="w-px h-5 bg-white/20 mx-1" />
        <button
          onMouseDown={(e) => {
            e.stopPropagation();
            undo();
          }}
          disabled={!hasStrokes}
          className="rounded p-1.5 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onMouseDown={(e) => {
            e.stopPropagation();
            clearAll();
          }}
          disabled={!hasStrokes}
          className="rounded p-1.5 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Konva stage */}
      <Stage
        width={width}
        height={height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: "none", cursor: "crosshair" }}
      >
        <Layer>
          {annotations.map((ann, i) => (
            <AnnotationShape key={i} annotation={ann} />
          ))}
          {currentPoints.length > 0 && (
            <AnnotationShape
              annotation={{
                type: tool,
                points: currentPoints,
                color,
                strokeWidth,
              }}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}

/** Renders a single annotation as the appropriate Konva shape. */
export function AnnotationShape({ annotation }: { annotation: Annotation }) {
  const { type, points, color, strokeWidth } = annotation;
  if (points.length === 0) return null;

  if (type === "freehand") {
    return (
      <Line
        points={points.flatMap((p) => [p.x, p.y])}
        stroke={color}
        strokeWidth={strokeWidth}
        lineCap="round"
        lineJoin="round"
        tension={0.5}
        listening={false}
      />
    );
  }

  if (type === "rectangle" && points.length >= 2) {
    const x1 = points[0].x,
      y1 = points[0].y;
    const x2 = points[points.length - 1].x,
      y2 = points[points.length - 1].y;
    return (
      <Rect
        x={Math.min(x1, x2)}
        y={Math.min(y1, y2)}
        width={Math.abs(x2 - x1)}
        height={Math.abs(y2 - y1)}
        stroke={color}
        strokeWidth={strokeWidth}
        listening={false}
      />
    );
  }

  if (type === "circle" && points.length >= 2) {
    const x1 = points[0].x,
      y1 = points[0].y;
    const x2 = points[points.length - 1].x,
      y2 = points[points.length - 1].y;
    return (
      <Ellipse
        x={(x1 + x2) / 2}
        y={(y1 + y2) / 2}
        radiusX={Math.abs(x2 - x1) / 2}
        radiusY={Math.abs(y2 - y1) / 2}
        stroke={color}
        strokeWidth={strokeWidth}
        listening={false}
      />
    );
  }

  if (type === "arrow" && points.length >= 2) {
    const x1 = points[0].x,
      y1 = points[0].y;
    const x2 = points[points.length - 1].x,
      y2 = points[points.length - 1].y;
    const dx = x2 - x1,
      dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const headLen = Math.min(15, Math.sqrt(dx * dx + dy * dy) * 0.3);
    return (
      <Line
        points={[
          x1,
          y1,
          x2,
          y2,
          x2 - headLen * Math.cos(angle - Math.PI / 6),
          y2 - headLen * Math.sin(angle - Math.PI / 6),
          x2,
          y2,
          x2 - headLen * Math.cos(angle + Math.PI / 6),
          y2 - headLen * Math.sin(angle + Math.PI / 6),
        ]}
        stroke={color}
        strokeWidth={strokeWidth}
        lineCap="round"
        lineJoin="round"
        closed={false}
        listening={false}
      />
    );
  }

  return null;
}
