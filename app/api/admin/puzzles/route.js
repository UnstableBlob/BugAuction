import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { getAllPuzzles } from "@/lib/puzzles";

export async function GET(req) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const puzzles = getAllPuzzles();

    return NextResponse.json({ puzzles });
  } catch (err) {
    console.error("Admin puzzles list error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
