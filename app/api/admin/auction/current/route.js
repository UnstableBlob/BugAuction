import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Auction from "@/models/Auction";
import Session from "@/models/Session";
import { getCache, setCache } from "@/lib/cache";

export async function GET(req) {
  try {
    // If we have cached the current auction response, return it directly to reduce DB load
    const cachedAuction = getCache("admin_current_auction");
    if (cachedAuction !== null) {
      return NextResponse.json({ auction: cachedAuction }, { status: 200 });
    }

    await connectDB();

    let activeSession = getCache('activeSession');
    if (!activeSession) {
      activeSession = await Session.findOne({ status: "started" }).sort({
        startedAt: -1,
      }).lean();
      if (activeSession) setCache('activeSession', activeSession, 2);
    }

    if (!activeSession) {
      return NextResponse.json({ auction: null }, { status: 200 });
    }

    const currentAuction = await Auction.findOne({
      sessionId: activeSession._id,
      status: "open",
    }).populate("bids.teamId").lean();

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

    setCache("admin_current_auction", cleanAuction, 2);

    return NextResponse.json({ auction: cleanAuction }, { status: 200 });
  } catch (err) {
    console.error("Fetch current auction error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
