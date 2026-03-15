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

        await connectDB();

        // Read the penalty amount from the active session (fallback: 5 min)
        let penaltySeconds = 300; // default 5 min
        if (team.activeSessionId) {
            const session = await Session.findById(team.activeSessionId, "penaltyMinutes").lean();
            if (session && session.penaltyMinutes != null) {
                penaltySeconds = Number(session.penaltyMinutes) * 60;
            }
        }

        const updated = await Team.findOneAndUpdate(
            { teamName: team.teamName },
            { $inc: { penaltySeconds } },
            { new: true, select: "teamName penaltySeconds" },
        );

        if (!updated)
            return NextResponse.json({ error: "Team not found" }, { status: 404 });

        return NextResponse.json({
            success: true,
            message: `⚠ Penalty applied: +${penaltySeconds}s (${penaltySeconds / 60} min)`,
            penaltySeconds: updated.penaltySeconds,
        });
    } catch (err) {
        console.error("Penalty route error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
