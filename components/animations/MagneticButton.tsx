"use client";
// components/animations/MagneticButton.tsx
// Button that magnetically follows the cursor on hover
// Usage: <MagneticButton>Explore Events</MagneticButton>

import { useRef } from "react";
import { motion, useSpring } from "framer-motion";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  strength?: number; // 0–1, how strongly it pulls
  onClick?: () => void;
  href?: string;
}

export function MagneticButton({
  children,
  className = "",
  strength = 0.35,
  onClick,
  href,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useSpring(0, { stiffness: 200, damping: 20 });
  const y = useSpring(0, { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const box = ref.current!.getBoundingClientRect();
    const cx  = box.left + box.width  / 2;
    const cy  = box.top  + box.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const Tag = href ? motion.a : motion.button;

  return (
    <div ref={ref} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <Tag
        href={href as string}
        onClick={onClick}
        style={{ x, y }}
        whileTap={{ scale: 0.96 }}
        className={className}
      >
        {children}
      </Tag>
    </div>
  );
}