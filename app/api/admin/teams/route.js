import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import Session from "@/models/Session";

export async function GET(req) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    // Proactively auto-catch teams whose session timer has expired.
    // This ensures the admin dashboard reflects correct statuses even if
    // a team's browser never polled /api/team/state after time ran out.
    const activeSession = await Session.findOne({ status: "started" })
      .sort({ startedAt: -1 })
      .lean();
    if (activeSession && activeSession.startedAt) {
      const endTime =
        new Date(activeSession.startedAt).getTime() +
        Number(activeSession.durationMinutes) * 60 * 1000;
      if (Date.now() > endTime) {
        // Bulk-catch all teams that are still 'playing' in this session
        await Team.updateMany(
          { activeSessionId: activeSession._id, status: "playing" },
          { $set: { status: "caught" } },
        );
      }
    }

    // Return all teams that have logged in (not inactive)
    const teams = await Team.find(
      { status: { $ne: "inactive" } },
      "teamName status activeSessionId solvedPuzzleIds penaltySeconds assignedPuzzleIds waitingRoomEnteredAt",
    ).lean();
    return NextResponse.json({ teams });
  } catch (err) {
    console.error("Admin teams error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
