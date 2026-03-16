"use client";
// app/(root)/colleges/CollegesClient.tsx
// READY TO COPY-PASTE — animations already integrated

import { useState }                      from "react";
import { CollegeClipLinks }              from "@/components/ui/college-clip-links";
import { FadeIn }                        from "@/components/animations/FadeIn";
import { BlurReveal }                    from "@/components/animations/TextReveal";

interface College {
  name: string;
  count: number;
  link?: string;
}

interface CollegesClientProps {
  initialColleges: College[];
}

export default function CollegesClient({ initialColleges }: CollegesClientProps) {
  const [colleges] = useState<College[]>(initialColleges);
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? colleges.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : colleges;

  return (
    <div className="min-h-screen px-4 pt-24 pb-12">

      {/* ── Animated Header ── */}
      <div className="max-w-5xl mx-auto mb-8 space-y-3">

        {/* Title — word-by-word blur reveal */}
        <BlurReveal
          text="Colleges"
          className="text-3xl font-bold text-white"
          delay={0.05}
        />

        {/* Subtitle — fades in after title */}
        <FadeIn delay={0.25} direction="up">
          <p className="text-muted-foreground text-sm">
            {colleges.length} institutions •{" "}
            {colleges.reduce((s, c) => s + c.count, 0)} events total
          </p>
        </FadeIn>

        {/* Search — slides in last */}
        <FadeIn delay={0.35} direction="up">
          <input
            type="text"
            placeholder="Search colleges…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-2 w-full max-w-sm rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </FadeIn>
      </div>

      {/* ── Grid — clip-path hover already handles animation ── */}
      <FadeIn delay={0.45} direction="up">
        <div className="max-w-5xl mx-auto">
          <CollegeClipLinks colleges={filtered} />
        </div>
      </FadeIn>

    </div>
  );
}