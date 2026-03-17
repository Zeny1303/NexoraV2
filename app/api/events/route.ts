import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database"; // adjust path if needed
import Event from "@/lib/database/models/event.model";


// ✅ FORCE REGISTER MODELS
import "@/lib/database/models/category.model";
import "@/lib/database/models/user.model";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const search   = searchParams.get("search")   ?? "";
    const category = searchParams.get("category") ?? "";
    const page     = parseInt(searchParams.get("page") ?? "1");
    const limit    = parseInt(searchParams.get("limit") ?? "50");

    // ── Build query ────────────────────────────────────────────────────────
    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { title:       { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location:    { $regex: search, $options: "i" } },
      ];
    }

    // ── Fetch ──────────────────────────────────────────────────────────────
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate("category",  "name")
        .populate("organizer", "firstName lastName photo")
        .sort({ startDateTime: 1 })   // soonest first
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(query),
    ]);

    return NextResponse.json({
      events,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[GET /api/events]", error);
    return NextResponse.json(
  {
    error:
      error instanceof Error ? error.message : JSON.stringify(error),
  },
  { status: 500 }
);
  }
}