import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Session from "@/models/Session";
import Team from "@/models/Team";
import Auction from "@/models/Auction";

export async function POST(req) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    await connectDB();

    const session = await Session.findById(sessionId);
    if (!session || session.status !== "started") {
      return NextResponse.json({ error: "Active session not found" }, { status: 404 });
    }

    // Check if there are any open auctions
    const openAuction = await Auction.findOne({ sessionId: session._id, status: "open" });
    if (openAuction) {
        return NextResponse.json({ error: "Cannot start game while an auction is still open." }, { status: 400 });
    }

    const now = new Date();

    // Update all teams belonging to this session from auctioning to playing
    await Team.updateMany(
      { activeSessionId: session._id, status: "auctioning" },
      { 
        $set: { 
            status: "playing",
            gameStartTime: now 
        } 
      }
    );

    // Also update the session startedAt time so the countdown begins NOW
    session.startedAt = now;
    await session.save();

    return NextResponse.json({ success: true, message: "Game phase started!" });
  } catch (err) {
    console.error("Start game phase error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
