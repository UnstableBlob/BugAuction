import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Auction from "@/models/Auction";
import Session from "@/models/Session";
import { getPuzzleById } from "@/lib/puzzles";

export async function POST(req) {
  try {
    const { sessionId, puzzleId } = await req.json();

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

    // Check if puzzle exists
    const puzzle = getPuzzleById(puzzleId);
    if (!puzzle) {
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
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
