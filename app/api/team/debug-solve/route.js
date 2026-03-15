import { NextResponse } from "next/server";
import { getTeamFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";

// ⚠️  DEBUG ONLY — auto-solves the current puzzle without checking the answer.
// Remove this route before going live.
export async function POST(req) {
    try {
        const team = await getTeamFromRequest(req);
        if (!team) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (team.status !== "playing")
            return NextResponse.json({ error: "Not in game" }, { status: 400 });

        await connectDB();

        const puzzleId = team.assignedPuzzleIds[team.currentIndex];
        if (!puzzleId)
            return NextResponse.json({ error: "No puzzle at current index" }, { status: 400 });

        const alreadySolved = team.solvedPuzzleIds.includes(puzzleId);
        const newSolved = alreadySolved
            ? team.solvedPuzzleIds
            : [...team.solvedPuzzleIds, puzzleId];

        const allSolved = newSolved.length >= team.assignedPuzzleIds.length;

        const nextIndex = allSolved
            ? team.currentIndex
            : Math.min(team.currentIndex + 1, team.assignedPuzzleIds.length - 1);

        await Team.findByIdAndUpdate(team._id, {
            solvedPuzzleIds: newSolved,
            currentIndex: nextIndex,
            status: allSolved ? "success" : "playing",
        });

        return NextResponse.json({
            success: true,
            allSolved,
            solvedCount: newSolved.length,
            totalPuzzles: team.assignedPuzzleIds.length,
            message: allSolved
                ? "All puzzles solved! Mission complete."
                : `Puzzle ${team.currentIndex + 1} solved. Moving to ${nextIndex + 1}.`,
        });
    } catch (err) {
        console.error("Debug solve error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
