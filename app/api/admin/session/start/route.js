import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";
import Session from "@/models/Session";
import Team from "@/models/Team";
import Puzzle from "@/models/Puzzle";

// Fisher-Yates shuffle with better entropy
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// We no longer shuffle and deal puzzles automatically.
// The admin will allot puzzles explicitly to the teams via the UI.

export async function POST(req) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { durationMinutes, puzzlesPerTeam, penaltyMinutes } = await req.json();
    if (!durationMinutes || durationMinutes < 1) {
      return NextResponse.json({ error: "durationMinutes must be >= 1" }, { status: 400 });
    }

    await connectDB();

    // Fetch waiting teams (teams that have logged in and are waiting)
    const waitingTeams = await Team.find({ status: "waiting" }).lean();
    const teamNames = waitingTeams.map((t) => t.teamName);

    // Fetch all puzzles from the flat pool
    const allPuzzles = await Puzzle.find({}, "puzzleId").lean();
    const allPuzzleIds = allPuzzles.map((p) => p.puzzleId);

    if (allPuzzleIds.length < (puzzlesPerTeam || 1)) {
      return NextResponse.json(
        { error: `Not enough puzzles in DB. Need ${puzzlesPerTeam}, have ${allPuzzleIds.length}` },
        { status: 400 },
      );
    }

    // Create session document
    const startTime = new Date();

    const sessionDoc = new Session({
      status: "started",
      startedAt: startTime,
      durationMinutes: Number(durationMinutes),
      puzzlesPerTeam: Number(puzzlesPerTeam || 5),
      penaltyMinutes: Number(penaltyMinutes ?? 5),
      teamNames,
    });

    // Collect existing assignments to store in session for historical context
    for (const tn of teamNames) {
      const t = waitingTeams.find((wt) => wt.teamName === tn);
      if (t && t.assignedPuzzleIds) {
        sessionDoc.assignments.set(tn, t.assignedPuzzleIds);
      } else {
        sessionDoc.assignments.set(tn, []);
      }
    }

    // Try transaction (replica set) approach
    const mongoSession = await mongoose.startSession();
    let usedTransaction = false;
    try {
      mongoSession.startTransaction();
      usedTransaction = true;

      await sessionDoc.save({ session: mongoSession });

      // Update all waiting teams atomically
      const updates = [];
      for (const t of waitingTeams) {
        updates.push(
          Team.updateOne(
            { _id: t._id, status: "waiting" },
            {
              $set: {
                status: "auctioning",
                // Notice we do NOT overwrite their assignedPuzzleIds!
                // they keep what the admin explicitly allotted them.
                currentIndex: 0,
                solvedPuzzleIds: [],
                penaltySeconds: 0,
                activeSessionId: sessionDoc._id,
                gameStartTime: startTime,
              },
            },
            { session: mongoSession },
          ),
        );
      }
      await Promise.all(updates);

      await mongoSession.commitTransaction();
      mongoSession.endSession();

      return NextResponse.json({ success: true, startTime, sessionId: sessionDoc._id });
    } catch (txErr) {
      if (usedTransaction) {
        await mongoSession.abortTransaction();
        mongoSession.endSession();
      }
      console.warn("Transaction failed, falling back to sequential updates:", txErr);
      // Fallback: save sessionDoc and perform sequential updates (best-effort)
    }

    // Fallback (no transaction): save session then update teams sequentially
    await sessionDoc.save();
    const failed = [];
    for (const t of waitingTeams) {
      const res = await Team.findOneAndUpdate(
        { _id: t._id, status: "waiting" },
        {
          status: "auctioning",
          currentIndex: 0,
          solvedPuzzleIds: [],
          penaltySeconds: 0,
          activeSessionId: sessionDoc._id,
          gameStartTime: startTime,
        },
      );
      if (!res) failed.push(t.teamName);
    }

    if (failed.length > 0) {
      return NextResponse.json({
        success: false,
        error: "Not all teams updated",
        failed,
        sessionId: sessionDoc._id,
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, startTime, sessionId: sessionDoc._id });
  } catch (err) {
    console.error("Start session error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
