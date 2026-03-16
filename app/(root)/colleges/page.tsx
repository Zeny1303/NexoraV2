// app/(root)/colleges/page.tsx — SERVER COMPONENT
import { connectToDatabase } from "@/lib/database";
import Event from "@/lib/database/models/event.model";
import CollegesClient from "./CollegesClient";

async function getColleges() {
  await connectToDatabase();

  // Pull location + url fields from all events
  const events = await Event.find(
    { location: { $exists: true, $ne: null } },
    { location: 1, url: 1, _id: 0 }
  ).lean();

  // Group by extracted college name → count events per college
  const collegeMap = new Map<string, { count: number; link?: string }>();

  for (const event of events) {
    const raw  = (event.location as string) ?? "";
    const name = extractCollegeName(raw);
    if (!name) continue;

    const existing = collegeMap.get(name);
    if (existing) {
      existing.count += 1;
    } else {
      collegeMap.set(name, {
        count: 1,
        link: (event.url as string) ?? undefined,
      });
    }
  }

  return Array.from(collegeMap.entries())
    .map(([name, { count, link }]) => ({ name, count, link }))
    .sort((a, b) => b.count - a.count); // most active colleges first
}

/**
 * Extracts a college/university name from a location string.
 *
 * "IIT BHU Campus, Varanasi, India"    →  "IIT BHU Campus"
 * "BBD University, Lucknow"            →  "BBD University"
 * "BIMSR - Bangalore"                  →  "BIMSR"
 * "Chikkakannalli, Bengaluru, …"       →  null  (no institution keyword)
 */
function extractCollegeName(location: string): string | null {
  if (!location.trim()) return null;

  const COLLEGE_KEYWORDS = [
    "university", "univerity", "college", "institute", "iit", "nit",
    "iiit", "iim", "bits", "campus", "school", "academy", "bimsr",
    "polytechnic", "deemed", "engineering", "medical",
  ];

  const lower = location.toLowerCase();
  const hasKeyword = COLLEGE_KEYWORDS.some((kw) => lower.includes(kw));
  if (!hasKeyword) return null;

  // Take everything before the first comma or " - " as the institution name
  return location.split(/,|\s-\s/)[0].trim();
}

export default async function CollegesPage() {
  const colleges = await getColleges();
  return <CollegesClient initialColleges={colleges} />;
}