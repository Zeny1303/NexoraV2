"use client";
// components/animations/CountUp.tsx
// Animated number that counts up when it enters the viewport
// Usage: <CountUp end={500} suffix="+" label="Events" />

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface CountUpProps {
  end: number;
  suffix?: string;
  prefix?: string;
  label?: string;
  duration?: number; // ms
  className?: string;
  labelClassName?: string;
}

export function CountUp({
  end,
  suffix = "",
  prefix = "",
  label,
  duration = 2000,
  className = "text-5xl font-bold text-white",
  labelClassName = "text-sm text-white/50 mt-1 uppercase tracking-widest",
}: CountUpProps) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const started = useRef(false);

  useEffect(() => {
    if (!isInView || started.current) return;
    started.current = true;

    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, end, duration]);

  return (
    <div ref={ref} className="flex flex-col items-center">
      <span className={className}>
        {prefix}{count.toLocaleString()}{suffix}
      </span>
      {label && <span className={labelClassName}>{label}</span>}
    </div>
  );
}