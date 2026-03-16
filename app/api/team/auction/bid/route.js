import { NextResponse } from "next/server";
import { getTeamFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Auction from "@/models/Auction";
import Team from "@/models/Team";
import Session from "@/models/Session";

export async function POST(req) {
  try {
    const teamCookie = await getTeamFromRequest(req);
    if (!teamCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await req.json();
    const bidAmount = parseInt(amount, 10);

    if (isNaN(bidAmount) || bidAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid bid amount" },
        { status: 400 }
      );
    }

    await connectDB();

    const team = await Team.findById(teamCookie._id);
    if (!team || team.status !== "auctioning") {
      return NextResponse.json(
        { error: "Team is not in auctioning state" },
        { status: 403 }
      );
    }

    if (team.currency < bidAmount) {
      return NextResponse.json(
        { error: "Insufficient currency" },
        { status: 400 }
      );
    }

    // Find the current active auction
    const activeSession = await Session.findOne({ status: "started" }).sort({
      startedAt: -1,
    });
    if (!activeSession) {
      return NextResponse.json(
        { error: "No active session found" },
        { status: 400 }
      );
    }

    const auction = await Auction.findOne({
      sessionId: activeSession._id,
      status: "open",
    });

    if (!auction) {
      return NextResponse.json(
        { error: "No active auction at the moment" },
        { status: 400 }
      );
    }

    // Check if the team has already bid
    const existingBidIndex = auction.bids.findIndex(
      (b) => b.teamId.toString() === team._id.toString()
    );

    if (existingBidIndex > -1) {
      return NextResponse.json(
        { error: "You have already placed a bid for this auction." },
        { status: 400 }
      );
    }

    // Place the bid
    auction.bids.push({
      teamId: team._id,
      amount: bidAmount,
      timestamp: new Date(),
    });

    await auction.save();

    return NextResponse.json(
      { message: "Bid placed successfully" },
      { status: 201 }
    );
  } catch (err) {
    console.error("Bid error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
