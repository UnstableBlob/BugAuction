import { NextResponse } from "next/server";
import { getTeamFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Auction from "@/models/Auction";
import Session from "@/models/Session";
import Puzzle from "@/models/Puzzle";
import Team from "@/models/Team";
import { getCache, setCache } from "@/lib/cache";

export async function GET(req) {
  try {
    const teamCookie = await getTeamFromRequest(req);
    if (!teamCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const team = await Team.findById(teamCookie._id).lean();
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Direct redirect if already playing
    if (team.status === "playing") {
      return NextResponse.json({ status: "playing" });
    }
    if (team.status === "success" || team.status === "caught") {
      return NextResponse.json({ status: team.status });
    }

    let activeSession = getCache('activeSession');
    if (!activeSession) {
      activeSession = await Session.findOne({ status: "started" }).sort({
        startedAt: -1,
      }).lean();
      if (activeSession) setCache('activeSession', activeSession, 2);
    }

    if (!activeSession) {
       return NextResponse.json(
        { status: "waiting", message: "Waiting for auction session to start." },
        { status: 200 }
      );
    }

    // Try to find an open auction first
    let currentAuction = await Auction.findOne({
      sessionId: activeSession._id,
      status: "open",
    })
      .populate("winnerTeamId", "teamName")
      .sort({ createdAt: -1 })
      .lean();

    // If no open auction, get the most recently closed one to show the result
    if (!currentAuction) {
      currentAuction = await Auction.findOne({ sessionId: activeSession._id })
        .populate("winnerTeamId", "teamName")
        .sort({ createdAt: -1 })
        .lean();
    }

    let auctionInfo = null;

    if (currentAuction) {
        let puzzleDetails = null;
        if(currentAuction.status === "open") {
           let p = getCache(`puzzle_${currentAuction.puzzleId}`);
           if (!p) {
               p = await Puzzle.findOne({ puzzleId: currentAuction.puzzleId}).lean();
               if(p) setCache(`puzzle_${currentAuction.puzzleId}`, p, 3600);
           }
           if(p) {
             puzzleDetails = {
                 puzzleId: p.puzzleId,
                 title: p.title,
                 prompt: p.prompt,
                 points: p.points,
             }
           }
        }

      const teamBidIndex = currentAuction.bids.findIndex(
        (b) => b.teamId.toString() === team._id.toString()
      );

      auctionInfo = {
        auctionId: currentAuction._id,
        puzzleId: currentAuction.puzzleId,
        puzzle: puzzleDetails,
        status: currentAuction.status,
        hasBid: teamBidIndex > -1,
        myBid: teamBidIndex > -1 ? currentAuction.bids[teamBidIndex].amount : null,
        winnerTeamName: currentAuction.winnerTeamId ? currentAuction.winnerTeamId.teamName : null,
        winningBid: currentAuction.winningBid,
      };
    }

    return NextResponse.json({
      status: team.status,
      currency: team.currency,
      auction: auctionInfo,
    });
  } catch (err) {
    console.error("Auction state error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
