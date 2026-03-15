import { NextResponse } from "next/server";
import { getTeamFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import Session from "@/models/Session";
import Puzzle from "@/models/Puzzle";

export async function GET(req) {
    try {
        const teamCookie = await getTeamFromRequest(req);
        if (!teamCookie)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();

        // Always fetch fresh from DB
        const team = await Team.findById(teamCookie._id).lean();
        if (!team)
            return NextResponse.json({ error: "Team not found" }, { status: 404 });

        // Resolve session for duration
        let session = null;
        if (team.activeSessionId) session = await Session.findById(team.activeSessionId).lean();

        const totalPuzzles = (team.assignedPuzzleIds || []).length;
        const solvedCount = (team.solvedPuzzleIds || []).length;
        const penaltySeconds = team.penaltySeconds || 0;
        const finalStatus = team.finalStatus || team.status;
        const finalScore = team.finalScore != null ? team.finalScore : solvedCount;

        // Time taken
        const gameStart = team.gameStartTime ? new Date(team.gameStartTime) : null;
        const finishTime = team.finishTime ? new Date(team.finishTime) : new Date();
        const timeTakenSeconds = gameStart
            ? Math.max(0, Math.floor((finishTime - gameStart) / 1000))
            : null;

        // Accuracy & success rate
        const accuracyPct = totalPuzzles > 0 ? Math.round((solvedCount / totalPuzzles) * 100) : 0;

        // Total duration of session
        const totalDurationSeconds = session ? session.durationMinutes * 60 : null;

        // Per-puzzle details
        const puzzleDetails = [];
        if (team.assignedPuzzleIds && team.assignedPuzzleIds.length > 0) {
            const puzzles = await Puzzle.find(
                { puzzleId: { $in: team.assignedPuzzleIds } },
                "puzzleId title type"
            ).lean();
            const puzzleMap = {};
            puzzles.forEach((p) => { puzzleMap[p.puzzleId] = p; });

            team.assignedPuzzleIds.forEach((pid, idx) => {
                const p = puzzleMap[pid];
                const isSolved = (team.solvedPuzzleIds || []).includes(pid);
                puzzleDetails.push({
                    index: idx + 1,
                    puzzleId: pid,
                    title: p ? p.title : pid,
                    type: p ? p.type : "unknown",
                    solved: isSolved,
                });
            });
        }

        return NextResponse.json({
            teamName: team.teamName,
            status: finalStatus,
            totalPuzzles,
            solvedCount,
            unsolvedCount: totalPuzzles - solvedCount,
            penaltySeconds,
            penaltyMinutes: Math.round(penaltySeconds / 60),
            accuracyPct,
            finalScore,
            timeTakenSeconds,
            totalDurationSeconds,
            gameStartTime: team.gameStartTime,
            finishTime: team.finishTime,
            puzzleDetails,
        });
    } catch (err) {
        console.error("Results error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
