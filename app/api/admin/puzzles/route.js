import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Puzzle from "@/models/Puzzle";
import { getCache, setCache } from "@/lib/cache";

export async function GET(req) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let puzzles = getCache("admin_all_puzzles");
    if (puzzles) {
      return NextResponse.json({ puzzles });
    }

    await connectDB();
    puzzles = await Puzzle.find({}).sort({ puzzleId: 1 }).lean();

    setCache("admin_all_puzzles", puzzles, 3600); // 1 hour

    return NextResponse.json({ puzzles });
  } catch (err) {
    console.error("Admin puzzles list error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
