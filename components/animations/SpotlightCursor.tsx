"use client";
// components/animations/SpotlightCursor.tsx
// Subtle glowing spotlight that follows the cursor across the page.
// Drop this once in your root layout inside the <body>.
// Usage: <SpotlightCursor />

import { useEffect, useRef } from "react";

export function SpotlightCursor({
  color = "rgba(124, 58, 237, 0.12)", // purple glow matching Nexora brand
  size = 480,
}: {
  color?: string;
  size?: number;
}) {
  const spotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = spotRef.current;
    if (!el) return;
    let raf: number;
    let tx = -size, ty = -size; // start offscreen
    let cx = tx, cy = ty;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX - size / 2;
      ty = e.clientY - size / 2;
    };

    const animate = () => {
      // Smooth lerp towards target
      cx += (tx - cx) * 0.1;
      cy += (ty - cy) * 0.1;
      el.style.transform = `translate(${cx}px, ${cy}px)`;
      raf = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [size]);

  return (
    <div
      ref={spotRef}
      aria-hidden
      style={{
        position: "fixed",
        top: 0, left: 0,
        width:  size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        pointerEvents: "none",
        zIndex: 9999,
        willChange: "transform",
        mixBlendMode: "screen",
      }}
    />
  );
}