import { NextResponse } from "next/server";
import { getTeamFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import Session from "@/models/Session";

export async function POST(req) {
  try {
    const team = await getTeamFromRequest(req);
    if (!team)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Allow finish from playing, success, or caught states
    const allowedStatuses = ["playing", "success", "caught"];
    if (!allowedStatuses.includes(team.status)) {
      return NextResponse.json(
        { error: "Team not in a finishable status" },
        { status: 400 },
      );
    }

    await connectDB();
    const now = new Date();

    // Determine final status
    const finalStatus = team.status === "caught" ? "caught" : "success";

    // Calculate time taken in seconds
    const gameStart = team.gameStartTime ? new Date(team.gameStartTime) : now;
    const timeTakenSeconds = Math.max(0, Math.floor((now - gameStart) / 1000));

    // Resolve session for total duration
    let session = null;
    if (team.activeSessionId) session = await Session.findById(team.activeSessionId);
    const totalDurationSeconds = session ? session.durationMinutes * 60 : 0;

    // Calculate stats
    const solvedCount = (team.solvedPuzzleIds || []).length;
    const totalPuzzles = (team.assignedPuzzleIds || []).length;
    const penaltySeconds = team.penaltySeconds || 0;

    // Accuracy: solved / total puzzles (0 if none)
    const accuracyPct = totalPuzzles > 0 ? Math.round((solvedCount / totalPuzzles) * 100) : 0;

    // Final score: puzzles solved, stored on team
    const finalScore = solvedCount;

    await Team.findByIdAndUpdate(team._id, {
      status: finalStatus === "caught" ? "caught" : "success",
      finishTime: team.finishTime || now,
      finalScore,
      finalPenalty: penaltySeconds,
      finalStatus,
    });

    return NextResponse.json({
      success: true,
      message: "Game finished!",
      timeTaken: timeTakenSeconds,
      finalStatus,
      finalScore,
      finalPenalty: penaltySeconds,
      accuracy: accuracyPct,
    });
  } catch (err) {
    console.error("Finish error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
