import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Session from "@/models/Session";
import Team from "@/models/Team";
import Auction from "@/models/Auction";

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

    // if there is no session yet we will still return auctioning teams rather than error
    // (so admins can watch teams log in before starting the session)
    const teamQuery = sessionDoc && sessionDoc._id
      ? { $or: [{ activeSessionId: sessionDoc._id }, { status: 'auctioning' }] }
      : { status: 'auctioning' };

    const teams = await Team.find(teamQuery).lean();

    const events = [];

    // Team events
    for (const t of teams) {
      if (t.loginTime) {
        events.push({ type: 'login', timestamp: new Date(t.loginTime).getTime(), teamName: t.teamName, detail: 'Logged in' });
      }
      if (t.gameStartTime) {
        events.push({ type: 'phase', timestamp: new Date(t.gameStartTime).getTime(), teamName: t.teamName, detail: 'Entered playing phase' });
      }
      if (t.submissionHistory && t.submissionHistory.length > 0) {
        for (const sub of t.submissionHistory) {
          const formattedAnswer = typeof sub.answer === 'string'
            ? sub.answer
            : JSON.stringify(sub.answer);
          const hasVerdict = typeof sub.isCorrect === 'boolean';
          const eventType = hasVerdict ? (sub.isCorrect ? 'solve' : 'submit') : 'submit';
          const eventDetail = hasVerdict
            ? (sub.isCorrect ? `Solved puzzle ${sub.puzzleId}` : `Incorrect answer on ${sub.puzzleId} (${formattedAnswer})`)
            : `Submitted answer on ${sub.puzzleId} (${formattedAnswer})`;
          events.push({ 
            type: eventType,
            timestamp: new Date(sub.timestamp).getTime(), 
            teamName: t.teamName, 
            detail: eventDetail,
          });
        }
      }
    }

    // Auction events
    if (sessionDoc && sessionDoc._id) {
       const auctions = await Auction.find({ sessionId: sessionDoc._id }).populate('bids.teamId', 'teamName').lean();
       for (const a of auctions) {
         if (a.bids && a.bids.length > 0) {
           for (const b of a.bids) {
              const teamName = b.teamId ? (b.teamId.teamName || 'Unknown Team') : 'Unknown';
              events.push({
                 type: 'bid',
                 timestamp: new Date(b.timestamp).getTime(),
                 teamName: teamName,
                 detail: `Bid $${b.amount} on ${a.puzzleId}`
              });
           }
         }
       }
    }

    events.sort((a, b) => b.timestamp - a.timestamp);
    const recentEvents = events.slice(0, 100);

    const sessionInfo = sessionDoc
      ? { id: sessionDoc._id, status: sessionDoc.status, startedAt: sessionDoc.startedAt, endedAt: sessionDoc.endedAt }
      : null;

    return NextResponse.json({ session: sessionInfo, eventLog: recentEvents });
  } catch (err) {
    console.error("Event log error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
