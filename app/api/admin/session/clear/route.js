import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Session from "@/models/Session";
import Team from "@/models/Team";
import Counter from "@/models/Counter";
import SessionHistory from "@/models/SessionHistory";

// Build a sorted leaderboard snapshot from teams in a given session
function buildLeaderboardSnapshot(session, teams) {
  const now = Date.now();
  const snapshot = teams.map((team) => {
    let timeTaken = null;
    if (team.status === "success" && team.finishTime && team.gameStartTime) {
      timeTaken = Math.floor(
        (new Date(team.finishTime).getTime() - new Date(team.gameStartTime).getTime()) / 1000
      );
    }
    return {
      teamName: team.teamName,
      status: team.status,
      solvedCount: (team.solvedPuzzleIds || []).length,
      totalPuzzles: (team.assignedPuzzleIds || []).length,
      penaltySeconds: team.penaltySeconds || 0,
      timeTaken,
    };
  });

  // Same sort as /api/admin/leaderboard
  snapshot.sort((a, b) => {
    if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
    if ((a.penaltySeconds || 0) !== (b.penaltySeconds || 0))
      return (a.penaltySeconds || 0) - (b.penaltySeconds || 0);
    // timeTaken: less is better (finished faster)
    if (a.timeTaken !== null && b.timeTaken !== null)
      return a.timeTaken - b.timeTaken;
    if (a.timeTaken !== null) return -1;
    if (b.timeTaken !== null) return 1;
    return 0;
  });

  return snapshot.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
}

// Admin can clear teams + sessions at any time — leaderboard is saved first.
export async function POST(req) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    // --- Snapshot: save leaderboard before deleting ---
    const latestSession = await Session.findOne().sort({ startedAt: -1 }).lean();
    if (latestSession) {
      const teamNames = latestSession.teamNames || [];
      // Include any playing/success/caught teams not registered in teamNames
      const activePlaying = await Team.find({
        status: { $in: ["playing", "success", "caught"] },
      }).lean();
      const allNames = [
        ...new Set([...teamNames, ...activePlaying.map((t) => t.teamName)]),
      ];
      const teams = await Team.find({ teamName: { $in: allNames } }).lean();

      if (teams.length > 0) {
        const leaderboardSnapshot = buildLeaderboardSnapshot(latestSession, teams);
        await SessionHistory.create({
          sessionId: latestSession._id,
          sessionStartedAt: latestSession.startedAt,
          sessionEndedAt: latestSession.endedAt,
          durationMinutes: latestSession.durationMinutes,
          clearedAt: new Date(),
          leaderboard: leaderboardSnapshot,
        });
      }
    }

    // --- Now clear teams, sessions, counter ---
    const teamResult = await Team.deleteMany({});
    const sessionResult = await Session.deleteMany({});
    // Reset tid counter so team numbering starts from 1 again
    await Counter.deleteOne({ _id: "teamTid" });

    return NextResponse.json({
      success: true,
      cleared: {
        teams: teamResult.deletedCount,
        sessions: sessionResult.deletedCount,
      },
      historySaved: !!latestSession,
    });
  } catch (err) {
    console.error("Clear session error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
