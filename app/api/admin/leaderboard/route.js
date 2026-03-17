import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Session from "@/models/Session";
import Team from "@/models/Team";
import { getCache, setCache } from "@/lib/cache";

export async function GET(req) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cachedResponse = getCache('admin_leaderboard');
    if (cachedResponse) {
      return NextResponse.json(cachedResponse);
    }

    await connectDB();

    // Find the most recent session (started or ended)
    let session = getCache('activeSession');
    if (!session) {
      session = await Session.findOne().sort({ startedAt: -1 }).lean();
      if (session && session.status === 'started') {
        setCache('activeSession', session, 2);
      }
    }

    if (!session) {
      return NextResponse.json({ leaderboard: [], session: null });
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
      let timeTaken = null;

      if (team.gameStartTime) {
        if (team.status === "success" && team.finishTime) {
          timeTaken = Math.floor((new Date(team.finishTime).getTime() - new Date(team.gameStartTime).getTime()) / 1000);
        } else {
          timeTaken = Math.floor((now - new Date(team.gameStartTime).getTime()) / 1000);
        }
      }

      return {
        teamName: team.teamName,
        status: team.status,
        solvedCount: (team.solvedPuzzleIds || []).length,
        totalPuzzles: (team.assignedPuzzleIds || []).length,
        timeTaken,
      };
    });

    // Sort: 1st priority = score (solvedCount) descending
    //       2nd priority = timeTaken ascending (less time = wins ties)
    leaderboard.sort((a, b) => {
      if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
      return (a.timeTaken || 0) - (b.timeTaken || 0);
    });

    const responseData = {
      leaderboard,
      session: {
        _id: session._id,
        status: session.status,
        startedAt: session.startedAt,
      },
    };

    setCache('admin_leaderboard', responseData, 2);

    return NextResponse.json(responseData);
  } catch (err) {
    console.error("Leaderboard error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
