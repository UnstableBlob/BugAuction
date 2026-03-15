import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Room from "@/models/Room";
import Team from "@/models/Team";
import Puzzle from "@/models/Puzzle";

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Deck-deal: deal Y puzzles per team from a shuffled pool
function dealPuzzles(allPuzzleIds, teams, puzzlesPerTeam) {
  const assignments = {};
  let deck = shuffle(allPuzzleIds);
  let deckIdx = 0;

  for (const teamName of teams) {
    const teamPuzzles = [];
    while (teamPuzzles.length < puzzlesPerTeam) {
      if (deckIdx >= deck.length) {
        deck = shuffle(allPuzzleIds);
        deckIdx = 0;
      }
      teamPuzzles.push(deck[deckIdx++]);
    }
    // Shuffle each team's own list so sequence differs even if sets overlap
    assignments[teamName] = shuffle(teamPuzzles);
  }
  return assignments;
}

export async function POST(req) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { roomId, durationMinutes } = await req.json();
    if (!roomId)
      return NextResponse.json({ error: "roomId required" }, { status: 400 });
    if (!durationMinutes || durationMinutes < 1) {
      return NextResponse.json(
        { error: "durationMinutes must be >= 1" },
        { status: 400 },
      );
    }

    await connectDB();
    const room = await Room.findById(roomId);
    if (!room)
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    if (room.status !== "waiting") {
      return NextResponse.json(
        { error: "Room is not in waiting state" },
        { status: 400 },
      );
    }

    // Fetch all puzzles from the flat pool
    const allPuzzles = await Puzzle.find({}, "puzzleId").lean();
    const allPuzzleIds = allPuzzles.map((p) => p.puzzleId);

    if (allPuzzleIds.length < room.puzzlesPerTeam) {
      return NextResponse.json(
        {
          error: `Not enough puzzles in DB. Need ${room.puzzlesPerTeam}, have ${allPuzzleIds.length}`,
        },
        { status: 400 },
      );
    }

    // Deck-deal puzzle assignment
    const assignments = dealPuzzles(
      allPuzzleIds,
      room.teamNames,
      room.puzzlesPerTeam,
    );

    // Update room
    const startTime = new Date();
    await Room.findByIdAndUpdate(roomId, {
      status: "started",
      startTime,
      durationMinutes: Number(durationMinutes),
    });

    // Update each team
    for (const teamName of room.teamNames) {
      await Team.findOneAndUpdate(
        { teamName },
        {
          status: "playing",
          assignedPuzzleIds: assignments[teamName],
          currentIndex: 0,
          solvedPuzzleIds: [],
          penaltySeconds: 0,
          activeRoomId: room._id,
          gameStartTime: startTime,
        },
      );
    }

    return NextResponse.json({ success: true, startTime });
  } catch (err) {
    console.error("Start room error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
