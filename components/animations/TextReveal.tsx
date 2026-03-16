"use client";
// components/animations/TextReveal.tsx
// Two effects: word-by-word blur-reveal AND a shimmer highlight text.
// Usage:
//   <BlurReveal text="Discover Every Event" />
//   <ShimmerText>500+ Events</ShimmerText>

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

// ── Blur Reveal ───────────────────────────────────────────────────────────────
// Words appear one by one with a blur-in effect
export function BlurReveal({
  text,
  className = "text-4xl font-bold",
  delay = 0,
  stagger = 0.07,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const words = text.split(" ");

  return (
    <p ref={ref} className={className} aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: "blur(12px)", y: 10 }}
          animate={isInView ? { opacity: 1, filter: "blur(0px)", y: 0 } : {}}
          transition={{ duration: 0.5, delay: delay + i * stagger, ease: "easeOut" }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </p>
  );
}

// ── Shimmer Text ──────────────────────────────────────────────────────────────
// Moving shimmer highlight across text (CSS-only, no JS needed)
export function ShimmerText({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-block ${className}`}
      style={{
        background: "linear-gradient(90deg, #fff 0%, #fff 35%, #a78bfa 50%, #fff 65%, #fff 100%)",
        backgroundSize: "200% auto",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        animation: "shimmer 3s linear infinite",
      }}
    >
      {children}
      <style>{`@keyframes shimmer { from { background-position: 200% center } to { background-position: -200% center } }`}</style>
    </span>
  );
}