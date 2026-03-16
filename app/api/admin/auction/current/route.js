import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Auction from "@/models/Auction";
import Session from "@/models/Session";

export async function GET(req) {
  try {
    await connectDB();

    const activeSession = await Session.findOne({ status: "started" }).sort({
      startedAt: -1,
    });

    if (!activeSession) {
      return NextResponse.json({ auction: null }, { status: 200 });
    }

    const currentAuction = await Auction.findOne({
      sessionId: activeSession._id,
      status: "open",
    }).populate("bids.teamId");

    let cleanAuction = null;
    if (currentAuction) {
      // Clean up the populated teamId just to return basic info securely
      const safeBids = currentAuction.bids.map((b) => ({
        teamName: b.teamId ? b.teamId.teamName : "Unknown",
        amount: b.amount,
        timestamp: b.timestamp,
      }));

      cleanAuction = {
        _id: currentAuction._id,
        puzzleId: currentAuction.puzzleId,
        status: currentAuction.status,
        bids: safeBids,
      };
    }

    return NextResponse.json({ auction: cleanAuction }, { status: 200 });
  } catch (err) {
    console.error("Fetch current auction error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
