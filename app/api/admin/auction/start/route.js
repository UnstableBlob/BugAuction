import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Auction from "@/models/Auction";
import Session from "@/models/Session";
import Team from "@/models/Team";
import { getPuzzleById } from "@/lib/puzzles";
import { getPowercardById } from "@/lib/powercards";

export async function POST(req) {
  try {
    const { sessionId, puzzleId, itemType = "puzzle" } = await req.json();

    if (!sessionId || !puzzleId) {
      return NextResponse.json(
        { error: "sessionId and puzzleId are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if session exists
    const session = await Session.findById(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if item exists
    const item = itemType === "powercard" ? getPowercardById(puzzleId) : getPuzzleById(puzzleId);
    if (!item) {
      return NextResponse.json({ error: `${itemType} not found` }, { status: 404 });
    }

    // For puzzles, check if already assigned. For powercards, maybe multiple can be owned?
    // User didn't specify, but usually puzzles are unique. Powercards might be too.
    if (itemType === "puzzle") {
      const assignedTeam = await Team.findOne({ assignedPuzzleIds: puzzleId });
      if (assignedTeam) {
        return NextResponse.json(
          { error: `Puzzle is already assigned to team: ${assignedTeam.teamName}` },
          { status: 400 }
        );
      }
    }

    // Check if there is already an open auction for this session
    const existingAuction = await Auction.findOne({
      sessionId,
      status: "open",
    });
    if (existingAuction) {
      return NextResponse.json(
        { error: "An auction is already open for this session. Close it first." },
        { status: 400 }
      );
    }

    // Create a new auction
    const auction = new Auction({
      sessionId,
      puzzleId,
      itemType,
      status: "open",
      bids: [],
    });

    await auction.save();

    return NextResponse.json(
      { message: "Auction started successfully", auction },
      { status: 201 }
    );
  } catch (err) {
    console.error("Auction start error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
