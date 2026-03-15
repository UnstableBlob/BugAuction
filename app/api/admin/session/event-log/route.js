import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Session from "@/models/Session";
import Team from "@/models/Team";

export async function GET(req) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");

    let sessionDoc = null;
    if (sessionId) {
      sessionDoc = await Session.findById(sessionId).lean();
    } else {
      sessionDoc = await Session.findOne().sort({ startedAt: -1 }).lean();
    }

    // if there is no session yet we will still return waiting teams rather than error
    // (so admins can watch teams log in before starting the session)
    const teamQuery = sessionDoc && sessionDoc._id
      ? { $or: [{ activeSessionId: sessionDoc._id }, { status: 'waiting' }] }
      : { status: 'waiting' };

    const teams = await Team.find(teamQuery).lean();

    const eventLog = teams.map((t) => ({
      teamName: t.teamName,
      // some old records used lastLoginAt instead of loginTime
      loginTime: t.loginTime || t.lastLoginAt || null,
      // waiting column removed on client, but keep for completeness
      waitingRoomEnteredAt: t.waitingRoomEnteredAt || t.lastLoginAt || null,
      gameStartedAt: t.gameStartTime || null,
      status: t.finalStatus || t.status || null,
      finalScore: t.finalScore || null,
      finalPenalty: t.finalPenalty || null,
    }));

    const sessionInfo = sessionDoc
      ? { id: sessionDoc._id, status: sessionDoc.status, startedAt: sessionDoc.startedAt, endedAt: sessionDoc.endedAt, durationMinutes: sessionDoc.durationMinutes }
      : null;

    return NextResponse.json({ session: sessionInfo, eventLog });
  } catch (err) {
    console.error("Event log error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
