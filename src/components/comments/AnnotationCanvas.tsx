"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, Undo2, Trash2, Pen, Square, Circle, ArrowUp } from "lucide-react";

export interface Annotation {
  type: "freehand" | "rectangle" | "circle" | "arrow";
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
}

interface AnnotationCanvasProps {
  onSave: (annotations: Annotation[]) => void;
  onCancel: () => void;
  className?: string;
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

export function AnnotationCanvas({
  onSave,
  onCancel,
  className,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Annotation["type"]>("freehand");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [strokeWidth] = useState(3);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentPoints, setCurrentPoints] = useState<
    { x: number; y: number }[]
  >([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const getPos = (
    e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent,
  ): { x: number; y: number } => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const clientX =
      "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY =
      "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  };

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;

    for (const ann of [
      ...annotations,
      ...(currentPoints.length > 0
        ? [
            {
              type: tool,
              points: currentPoints,
              color,
              strokeWidth,
            } as Annotation,
          ]
        : []),
    ]) {
      ctx.strokeStyle = ann.color;
      ctx.lineWidth = ann.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();

      if (ann.type === "freehand" && ann.points.length > 0) {
        ctx.moveTo(ann.points[0].x * w, ann.points[0].y * h);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x * w, ann.points[i].y * h);
        }
        ctx.stroke();
      } else if (
        (ann.type === "rectangle" ||
          ann.type === "circle" ||
          ann.type === "arrow") &&
        ann.points.length >= 2
      ) {
        const x1 = ann.points[0].x * w,
          y1 = ann.points[0].y * h;
        const x2 = ann.points[ann.points.length - 1].x * w,
          y2 = ann.points[ann.points.length - 1].y * h;
        if (ann.type === "rectangle") {
          ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        } else if (ann.type === "circle") {
          const rx = Math.abs(x2 - x1) / 2,
            ry = Math.abs(y2 - y1) / 2;
          ctx.ellipse(
            x1 + (x2 - x1) / 2,
            y1 + (y2 - y1) / 2,
            rx,
            ry,
            0,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
        } else if (ann.type === "arrow") {
          const dx = x2 - x1,
            dy = y2 - y1;
          const angle = Math.atan2(dy, dx);
          const headLen = 15;
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineTo(
            x2 - headLen * Math.cos(angle - Math.PI / 6),
            y2 - headLen * Math.sin(angle - Math.PI / 6),
          );
          ctx.moveTo(x2, y2);
          ctx.lineTo(
            x2 - headLen * Math.cos(angle + Math.PI / 6),
            y2 - headLen * Math.sin(angle + Math.PI / 6),
          );
          ctx.stroke();
        }
      }
    }
  }, [annotations, currentPoints, tool, color, strokeWidth]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      // Firefox fallback: ensure non-zero dimensions
      if (rect.width === 0 || rect.height === 0) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);
      redraw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [redraw]);

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setCurrentPoints([getPos(e)]);
  };

  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    setCurrentPoints((prev) => [...prev, getPos(e)]);
  };

  const endDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPoints.length > 0) {
      setAnnotations((prev) => [
        ...prev,
        { type: tool, points: currentPoints, color, strokeWidth },
      ]);
    }
    setCurrentPoints([]);
  };

  const undo = () => setAnnotations((prev) => prev.slice(0, -1));
  const clear = () => setAnnotations([]);

  return (
    <div className={cn("relative", className)}>
      {/* Toolbar */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-lg bg-black/80 px-2 py-1.5 shadow-lg">
        {(
          [
            { type: "freehand" as const, icon: Pen },
            { type: "rectangle" as const, icon: Square },
            { type: "circle" as const, icon: Circle },
            { type: "arrow" as const, icon: ArrowUp },
          ] as const
        ).map((t) => (
          <button
            key={t.type}
            onClick={() => setTool(t.type)}
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
            onClick={() => setColor(c)}
            className={cn(
              "h-5 w-5 rounded-full border-2 transition-all",
              color === c ? "border-white scale-110" : "border-transparent",
            )}
            style={{ backgroundColor: c }}
          />
        ))}
        <div className="w-px h-5 bg-white/20 mx-1" />
        <button
          onClick={undo}
          disabled={annotations.length === 0}
          className="rounded p-1.5 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={clear}
          disabled={annotations.length === 0}
          className="rounded p-1.5 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 w-full h-full cursor-crosshair touch-none"
        style={{ touchAction: "none" }}
        onMouseDown={startDraw}
        onMouseMove={moveDraw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={moveDraw}
        onTouchEnd={endDraw}
        onPointerDown={(e) => {
          e.preventDefault();
          startDraw(e as any);
        }}
        onPointerMove={(e) => {
          e.preventDefault();
          moveDraw(e as any);
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          endDraw(e as any);
        }}
      />

      {/* Bottom actions */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        <button
          onClick={onCancel}
          className="rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white hover:bg-black/80 transition-colors"
        >
          <X className="h-3.5 w-3.5 inline mr-1" /> Cancel
        </button>
        <button
          onClick={() => onSave(annotations)}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary/90 transition-colors"
        >
          Save & Comment
        </button>
      </div>
    </div>
  );
}
