import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Puzzle from "@/models/Puzzle";

export async function GET(req) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const puzzles = await Puzzle.find({}).sort({ puzzleId: 1 }).lean();

    return NextResponse.json({ puzzles });
  } catch (err) {
    console.error("Admin puzzles list error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
