import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import Counter from "@/models/Counter";
import { setTeamCookie } from "@/lib/session";

export async function POST(req) {
  try {
    const { teamName, password, register } = await req.json();
    if (!teamName) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 },
      );
    }
    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 },
      );
    }

    await connectDB();

    // Clean up null tid fields (can conflict with unique index)
    try {
      await Team.updateMany({ tid: null }, { $unset: { tid: "" } });
    } catch (e) {
      console.warn("tid cleanup warning:", e.message || e);
    }

    // Ensure tid index is unique + sparse to allow missing tid values
    try {
      const existingIndexes = await Team.collection.indexes();
      const tidIndex = existingIndexes.find((ix) => ix.key && ix.key.tid === 1);
      if (tidIndex) {
        const isSparse = !!tidIndex.sparse;
        const isUnique = !!tidIndex.unique;
        if (!isSparse || !isUnique) {
          try {
            await Team.collection.dropIndex(tidIndex.name);
          } catch (dropErr) {
            console.warn('Failed to drop tid index:', dropErr.message || dropErr);
          }
          await Team.collection.createIndex({ tid: 1 }, { unique: true, sparse: true });
        }
      } else {
        await Team.collection.createIndex({ tid: 1 }, { unique: true, sparse: true });
      }
    } catch (e) {
      console.warn('tid index ensure warning:', e.message || e);
    }

    // Initialize counter from the current max tid (so new tids continue)
    try {
      const maxTeam = await Team.findOne({ tid: { $exists: true } }).sort({ tid: -1 }).select('tid').lean();
      const startSeq = maxTeam && typeof maxTeam.tid === 'number' ? maxTeam.tid : 0;
      await Counter.findOneAndUpdate(
        { _id: 'teamTid' },
        { $setOnInsert: { seq: startSeq } },
        { upsert: true },
      );
    } catch (e) {
      console.warn('counter init warning:', e.message || e);
    }

    // Check if team exists
    let team = await Team.findOne({ teamName: teamName.trim() });

    // If register flag is true, create new team
    if (register) {
      if (team) {
        return NextResponse.json(
          { error: "Team name already taken" },
          { status: 409 },
        );
      }

      // Generate next tid atomically
      const counter = await Counter.findOneAndUpdate(
        { _id: 'teamTid' },
        { $inc: { seq: 1 } },
        { new: true },
      );

      // Create new team — always land in waiting room first
      const now = new Date();

      team = await Team.create({
        teamName: teamName.trim(),
        password: password,
        tid: counter.seq,
        status: 'waiting',
        lastLoginAt: now,
        loginTime: now,
        waitingRoomEnteredAt: now,
        assignedPuzzleIds: [],
        activeSessionId: null,
        currentIndex: 0,
        solvedPuzzleIds: [],
        penaltySeconds: 0,
        gameStartTime: null,
      });

      const res = NextResponse.json({
        success: true,
        teamName: team.teamName,
        status: team.status,
      });

      setTeamCookie(res, team.teamName);
      return res;
    }

    // Login existing team
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Verify password
    if (team.password !== password) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 },
      );
    }

    // If the team exists but doesn't have a tid (older data), assign one now
    if (team.tid === undefined || team.tid === null) {
      const counter = await Counter.findOneAndUpdate(
        { _id: 'teamTid' },
        { $inc: { seq: 1 } },
        { new: true },
      );
      team.tid = counter.seq;
    }

    // Always put returning teams back to waiting — admin must approve them.
    // This covers re-logins after a game ended, mid-session late-joins, etc.
    const now = new Date();
    team.loginTime = now;
    team.status = 'waiting';
    team.waitingRoomEnteredAt = now;
    // Always clear old game state so they start fresh on next approval
    team.assignedPuzzleIds = [];
    team.currentIndex = 0;
    team.solvedPuzzleIds = [];
    team.penaltySeconds = 0;
    team.activeSessionId = null;
    team.activeRoomId = null;
    team.gameStartTime = null;
    team.finishTime = null;
    team.finalScore = null;
    team.finalPenalty = null;
    team.finalStatus = null;
    team.lastLoginAt = now;
    await team.save();

    const res = NextResponse.json({
      success: true,
      teamName: team.teamName,
      status: team.status,
    });

    setTeamCookie(res, team.teamName);
    return res;
  } catch (err) {
    console.error("Team login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
