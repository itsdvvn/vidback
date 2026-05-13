"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-8 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function DemoPlayer() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setStep((s) => {
        if (s >= 3) { setPlaying(false); return 3; }
        return s + 1;
      });
    }, 1500);
    return () => clearInterval(timer);
  }, [playing]);

  const demoComments = [
    { time: "0:12", author: "Client", text: "Can we speed up this transition?", active: step >= 1 },
    { time: "0:45", author: "Client", text: "The color grade looks off here", active: step >= 2 },
    { time: "1:23", author: "You", text: "Fixed in v2 — check now ✓", active: step >= 3 },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
      <div className="relative bg-black aspect-video flex items-center justify-center">
        <div className="text-center">
          <button
            onClick={() => { setStep(0); setPlaying(true); }}
            className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center transition-all mx-auto"
          >
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
          <p className="text-white/60 text-xs mt-2 font-mono">
            {playing ? "▶ Playing demo…" : "▶ Click to play demo"}
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>
      <div className="p-4 space-y-2">
        {demoComments.map((c, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 rounded-lg p-3 transition-all duration-500 ${
              c.active
                ? "bg-primary/10 border border-primary/20 translate-x-0 opacity-100"
                : "bg-muted/30 border border-transparent translate-x-4 opacity-40"
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">{c.time}</span>
                <span className={`text-xs font-medium ${c.author === "You" ? "text-primary" : "text-foreground"}`}>
                  {c.author}
                </span>
              </div>
              <p className="text-sm mt-0.5 text-foreground/80">{c.text}</p>
            </div>
            {c.active && (
              <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5 animate-pulse" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export { Reveal, DemoPlayer };
