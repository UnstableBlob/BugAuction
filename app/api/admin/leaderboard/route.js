import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Session from "@/models/Session";
import Team from "@/models/Team";

export async function GET(req) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    // Find the most recent session (started or ended)
    const session = await Session.findOne()
      .sort({ startedAt: -1 })
      .lean();

    if (!session) {
      return NextResponse.json({ leaderboard: [], session: null });
    }

    // Proactively catch any teams whose timer has expired - same logic as /api/admin/teams
    if (session.status === "started" && session.startedAt) {
      const endTime =
        new Date(session.startedAt).getTime() +
        Number(session.durationMinutes) * 60 * 1000;
      if (Date.now() > endTime) {
        await Team.updateMany(
          { activeSessionId: session._id, status: "playing" },
          { $set: { status: "caught" } },
        );
      }
    }

    // Get all teams that participated in this session
    const teamNames = session.teamNames || [];
    // Also include any playing/success/caught teams not in teamNames (late joiners)
    const activePlaying = await Team.find({
      status: { $in: ["playing", "success", "caught"] },
    }).lean();
    const allNames = [
      ...new Set([...teamNames, ...activePlaying.map((t) => t.teamName)]),
    ];

    const teams = await Team.find({ teamName: { $in: allNames } }).lean();

    const now = Date.now();
    const leaderboard = teams.map((team) => {
      let timeLeft = null;
      let timeTaken = null;

      if (session.startedAt && session.status === "started") {
        const endTime =
          new Date(session.startedAt).getTime() +
          Number(session.durationMinutes) * 60 * 1000;
        timeLeft =
          Math.floor((endTime - now) / 1000) - (team.penaltySeconds || 0);
        if (timeLeft < 0) timeLeft = 0;
      }

      if (team.status === "success" && team.finishTime && team.gameStartTime) {
        timeTaken = Math.floor(
          (new Date(team.finishTime).getTime() -
            new Date(team.gameStartTime).getTime()) /
          1000
        );
      }

      return {
        teamName: team.teamName,
        status: team.status,
        solvedCount: (team.solvedPuzzleIds || []).length,
        totalPuzzles: (team.assignedPuzzleIds || []).length,
        penaltySeconds: team.penaltySeconds || 0,
        timeLeft,
        timeTaken,
      };
    });

    // Sort: 1st priority = score (solvedCount) descending
    //       2nd priority = penalty (penaltySeconds) ascending (less penalty wins ties)
    //       3rd priority = timeLeft descending (more time remaining = solved faster = wins ties)
    leaderboard.sort((a, b) => {
      if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
      if ((a.penaltySeconds || 0) !== (b.penaltySeconds || 0))
        return (a.penaltySeconds || 0) - (b.penaltySeconds || 0);
      return (b.timeLeft || 0) - (a.timeLeft || 0);
    });

    return NextResponse.json({
      leaderboard,
      session: {
        _id: session._id,
        status: session.status,
        durationMinutes: session.durationMinutes,
        startedAt: session.startedAt,
      },
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
