"use client";

import { useState, useCallback, useRef, type CSSProperties } from "react";
import { Stage, Layer, Line, Rect, Ellipse, Arrow } from "react-konva";
import type { Annotation } from "@/components/video/VideoPlayerProvider";
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
  onSave: (annotations: Annotation[]) => void;
  onCancel: () => void;
  className?: string;
  style?: CSSProperties;
}

const COLORS = [
  "#ff0000",
  "#ffa500",
  "#ffff00",
  "#00ff00",
  "#00bfff",
  "#ff00ff",
  "#ffffff",
];
const DEFAULT_COLOR = "#ff0000";

type ToolType = Annotation["type"];

export function AnnotationCanvasV2({
  width,
  height,
  onSave,
  onCancel,
  className,
  style,
}: AnnotationCanvasV2Props) {
  const [tool, setTool] = useState<ToolType>("freehand");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const strokeWidth = 3;

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Current stroke being drawn (freehand points or shape anchor)
  const [currentPoints, setCurrentPoints] = useState<
    { x: number; y: number }[]
  >([]);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<{ x: number; y: number }[]>([]);

  // For rectangle/circle/arrow: track the start point
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null);

  // For freehand: accumulate points via ref (avoids stale closures)
  const handlePointerDown = useCallback(
    (e: any) => {
      // Only handle direct canvas events, not toolbar clicks
      if (e.target !== e.target.getStage()) return;

      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;

      isDrawingRef.current = true;
      shapeStartRef.current = { x: pos.x, y: pos.y };

      if (tool === "freehand") {
        currentPointsRef.current = [{ x: pos.x, y: pos.y }];
        setCurrentPoints([{ x: pos.x, y: pos.y }]);
      } else {
        // For shapes, just record start
        currentPointsRef.current = [{ x: pos.x, y: pos.y }];
        setCurrentPoints([{ x: pos.x, y: pos.y }]);
      }
    },
    [tool],
  );

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
        // For shapes: points[0] = start, points[1..] = current pointer
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
      // For shapes (rectangle, circle, arrow), only save if we have 2+ points
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

  const undo = () => setAnnotations((prev) => prev.slice(0, -1));
  const clearAll = () => setAnnotations([]);
  const hasStrokes = annotations.length > 0;

  const handleCancel = useCallback(() => {
    if (hasStrokes) {
      if (window.confirm("Discard your annotations? They won't be saved.")) {
        onCancel();
      }
    } else {
      onCancel();
    }
  }, [hasStrokes, onCancel]);

  return (
    <div className={cn("relative", className)} style={style}>
      {/* Toolbar */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-lg bg-black/80 px-2 py-1.5 shadow-lg">
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
          disabled={annotations.length === 0}
          className="rounded p-1.5 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onMouseDown={(e) => {
            e.stopPropagation();
            clearAll();
          }}
          disabled={annotations.length === 0}
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
          {/* Saved annotations */}
          {annotations.map((ann, i) => (
            <AnnotationShape key={i} annotation={ann} />
          ))}
          {/* In-progress stroke */}
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

      {/* Bottom actions */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {hasStrokes && (
          <span className="text-[10px] font-medium text-white/60 bg-black/50 rounded-md px-2 py-1">
            {annotations.length} stroke{annotations.length !== 1 ? "s" : ""}
          </span>
        )}
        <button
          onMouseDown={(e) => {
            e.stopPropagation();
            handleCancel();
          }}
          className="rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white hover:bg-black/80 transition-colors"
        >
          <X className="h-3.5 w-3.5 inline mr-1" /> Cancel
        </button>
        <button
          onMouseDown={(e) => {
            e.stopPropagation();
            onSave(annotations);
          }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/40"
        >
          Save & Comment
        </button>
      </div>
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
    const arrowPoints = [
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
    ];
    return (
      <Line
        points={arrowPoints}
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
