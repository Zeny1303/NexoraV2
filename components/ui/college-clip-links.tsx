"use client";

import { useAnimate } from "framer-motion";
import { Building2, ExternalLink } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface College {
  name: string;
  count: number;
  link?: string; // optional direct link; falls back to slug
}

interface CollegeClipLinksProps {
  colleges: College[];
}

// ─── Clip-path constants ───────────────────────────────────────────────────────
const NO_CLIP           = "polygon(0 0, 100% 0, 100% 100%, 0% 100%)";
const BOTTOM_RIGHT_CLIP = "polygon(0 0, 100% 0, 0 0, 0% 100%)";
const TOP_RIGHT_CLIP    = "polygon(0 0, 0 100%, 100% 100%, 0% 100%)";
const BOTTOM_LEFT_CLIP  = "polygon(100% 100%, 100% 0, 100% 100%, 0 100%)";
const TOP_LEFT_CLIP     = "polygon(0 0, 100% 0, 100% 100%, 100% 0)";

const ENTRANCE_KEYFRAMES: Record<string, string[]> = {
  left:   [BOTTOM_RIGHT_CLIP, NO_CLIP],
  bottom: [BOTTOM_RIGHT_CLIP, NO_CLIP],
  top:    [BOTTOM_RIGHT_CLIP, NO_CLIP],
  right:  [TOP_LEFT_CLIP,     NO_CLIP],
};

const EXIT_KEYFRAMES: Record<string, string[]> = {
  left:   [NO_CLIP, TOP_RIGHT_CLIP],
  bottom: [NO_CLIP, TOP_RIGHT_CLIP],
  top:    [NO_CLIP, TOP_RIGHT_CLIP],
  right:  [NO_CLIP, BOTTOM_LEFT_CLIP],
};

// ─── Helper: slugify name → URL segment ───────────────────────────────────────
const toSlug = (name: string) =>
  name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

// ─── Single College Box ────────────────────────────────────────────────────────
const CollegeBox = ({ college }: { college: College }) => {
  const [scope, animate] = useAnimate();

  const getNearestSide = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const sides = [
      { side: "left",   proximity: Math.abs(box.left   - e.clientX) },
      { side: "right",  proximity: Math.abs(box.right  - e.clientX) },
      { side: "top",    proximity: Math.abs(box.top    - e.clientY) },
      { side: "bottom", proximity: Math.abs(box.bottom - e.clientY) },
    ];
    return sides.sort((a, b) => a.proximity - b.proximity)[0].side;
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const side = getNearestSide(e);
    animate(scope.current, { clipPath: ENTRANCE_KEYFRAMES[side] });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const side = getNearestSide(e);
    animate(scope.current, { clipPath: EXIT_KEYFRAMES[side] });
  };

  // Link to events page filtered by this college's location
  const href = college.link ?? `/events?location=${encodeURIComponent(college.name)}`;

  return (
    <a
      href={href}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative flex flex-col items-center justify-center h-28 sm:h-36 md:h-40 w-full gap-2 text-foreground bg-background overflow-hidden cursor-pointer"
    >
      {/* Default (resting) state */}
      <Building2 className="w-5 h-5 sm:w-6 sm:h-6 opacity-60" />
      <span className="text-sm sm:text-base font-semibold text-center px-4 leading-tight line-clamp-2 text-white">
        {college.name}
      </span>
      <span className="text-[11px] text-white/50">
        {college.count} event{college.count !== 1 ? "s" : ""}
      </span>

      {/* Hover overlay */}
      <div
        ref={scope}
        style={{ clipPath: BOTTOM_RIGHT_CLIP }}
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-primary text-primary-foreground px-3"
      >
        <ExternalLink className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="text-xs sm:text-sm font-semibold text-center leading-tight line-clamp-2">
          {college.name}
        </span>
        <span className="text-[10px] opacity-80">
          {college.count} event{college.count !== 1 ? "s" : ""}
        </span>
      </div>
    </a>
  );
};

// ─── Grid layout helpers ───────────────────────────────────────────────────────
/**
 * Splits colleges into rows of varying widths to mimic the ClipPathLinks layout:
 *   Row 1 → 2 columns
 *   Row 2 → 4 columns
 *   Row 3 → 3 columns
 *   … repeat
 */
const ROW_PATTERN = [2, 4, 3];

function chunkByPattern(items: College[]) {
  const rows: College[][] = [];
  let i = 0;
  let patternIdx = 0;
  while (i < items.length) {
    const size = ROW_PATTERN[patternIdx % ROW_PATTERN.length];
    rows.push(items.slice(i, i + size));
    i += size;
    patternIdx++;
  }
  return rows;
}

// ─── Main export ──────────────────────────────────────────────────────────────
export const CollegeClipLinks = ({ colleges }: CollegeClipLinksProps) => {
  if (!colleges.length) {
    return (
      <p className="text-muted-foreground text-sm text-center py-10">
        No colleges found.
      </p>
    );
  }

  const rows = chunkByPattern(colleges);

  return (
    <div className="divide-y border divide-border border-border">
      {rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className={`grid divide-x divide-border`}
          style={{ gridTemplateColumns: `repeat(${row.length}, 1fr)` }}
        >
          {row.map((college) => (
            <CollegeBox key={college.name} college={college} />
          ))}
        </div>
      ))}
    </div>
  );
};