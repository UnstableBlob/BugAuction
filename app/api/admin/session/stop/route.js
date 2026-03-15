import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";
import Session from "@/models/Session";
import Team from "@/models/Team";

export async function POST(req) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sessionId } = await req.json();

    await connectDB();

    let sessionDoc;
    if (sessionId) {
      sessionDoc = await Session.findById(sessionId);
    } else {
      // find latest started session
      sessionDoc = await Session.findOne({ status: "started" }).sort({ startedAt: -1 });
    }
    if (!sessionDoc) return NextResponse.json({ error: "No active session found" }, { status: 404 });

    const endedAt = new Date();

    // Try transaction
    const mongoSession = await mongoose.startSession();
    let usedTxn = false;
    try {
      mongoSession.startTransaction();
      usedTxn = true;

      // mark session ended
      await Session.updateOne({ _id: sessionDoc._id }, { $set: { status: "ended", endedAt } }, { session: mongoSession });

      // load teams in this session
      const teams = await Team.find({ activeSessionId: sessionDoc._id }).session(mongoSession);

      const updates = [];
      for (const t of teams) {
        const finalScore = (t.solvedPuzzleIds || []).length;
        const assignedCount = (t.assignedPuzzleIds || []).length || sessionDoc.puzzlesPerTeam || 0;
        const finalPenalty = t.penaltySeconds || 0;
        const finalStatus = finalScore >= assignedCount ? "success" : "caught";
        const finishTime = t.finishTime || endedAt;

        updates.push(
          Team.updateOne(
            { _id: t._id },
            {
              $set: {
                finalScore,
                finalPenalty,
                finalStatus,
                finishTime,
                status: finalStatus,
              },
            },
            { session: mongoSession },
          ),
        );
      }
      await Promise.all(updates);

      await mongoSession.commitTransaction();
      mongoSession.endSession();

      return NextResponse.json({ success: true, endedAt });
    } catch (txErr) {
      if (usedTxn) {
        await mongoSession.abortTransaction();
        mongoSession.endSession();
      }
      console.warn("Transaction failed during session stop, falling back:", txErr);
    }

    // Fallback (no txn)
    await Session.updateOne({ _id: sessionDoc._id }, { $set: { status: "ended", endedAt } });
    const teams = await Team.find({ activeSessionId: sessionDoc._id }).lean();
    const failed = [];
    for (const t of teams) {
      const finalScore = (t.solvedPuzzleIds || []).length;
      const assignedCount = (t.assignedPuzzleIds || []).length || sessionDoc.puzzlesPerTeam || 0;
      const finalPenalty = t.penaltySeconds || 0;
      const finalStatus = finalScore >= assignedCount ? "success" : "caught";
      const finishTime = t.finishTime || endedAt;

      const res = await Team.updateOne({ _id: t._id }, { $set: { finalScore, finalPenalty, finalStatus, finishTime, status: finalStatus } });
      if (res.nModified === 0 && res.modifiedCount === 0) failed.push(t.teamName || t._id);
    }

    if (failed.length > 0) {
      return NextResponse.json({ success: false, error: "Some teams failed to finalize", failed }, { status: 500 });
    }

    return NextResponse.json({ success: true, endedAt });
  } catch (err) {
    console.error("Stop session error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
