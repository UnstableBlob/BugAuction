import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Session from "@/models/Session";

export async function PATCH(req) {
  try {
    const { maxPuzzlesPerTeam } = await req.json();

    if (maxPuzzlesPerTeam === undefined || isNaN(maxPuzzlesPerTeam) || maxPuzzlesPerTeam < 1) {
      return NextResponse.json({ error: "Invalid maxPuzzlesPerTeam value" }, { status: 400 });
    }

    await connectDB();

    const session = await Session.findOne({ status: "started" }).sort({ startedAt: -1 });
    if (!session) {
      return NextResponse.json({ error: "No active session found" }, { status: 404 });
    }

    session.maxPuzzlesPerTeam = parseInt(maxPuzzlesPerTeam);
    await session.save();

    return NextResponse.json({ message: "Settings updated", maxPuzzlesPerTeam: session.maxPuzzlesPerTeam });
  } catch (err) {
    console.error("Session settings error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
