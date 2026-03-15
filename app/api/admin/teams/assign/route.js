import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import Session from "@/models/Session";

export async function POST(req) {
    try {
        const admin = await getAdminFromRequest(req);
        if (!admin)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { teamName, assignedPuzzleIds } = await req.json();

        if (!teamName || !Array.isArray(assignedPuzzleIds)) {
            return NextResponse.json(
                { error: "Invalid payload: requires teamName and assignedPuzzleIds array" },
                { status: 400 }
            );
        }

        await connectDB();
        const team = await Team.findOne({ teamName });

        if (!team) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        team.assignedPuzzleIds = assignedPuzzleIds;
        await team.save();

        // If the team is currently in an active session, we should also update the session's assignment record for them
        // This keeps the Session data in sync
        if (team.activeSessionId) {
            const session = await Session.findById(team.activeSessionId);
            if (session) {
                if (!session.assignments) {
                    session.assignments = new Map();
                }
                session.assignments.set(teamName, assignedPuzzleIds);
                await session.save();
            }
        }

        return NextResponse.json({ success: true, team });
    } catch (err) {
        console.error("Assign puzzles error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
