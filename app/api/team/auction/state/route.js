import { NextResponse } from "next/server";
import { getTeamFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Auction from "@/models/Auction";
import Session from "@/models/Session";
import Team from "@/models/Team";
import { getCache, setCache } from "@/lib/cache";
import { getPuzzleById } from "@/lib/puzzles";
import { getPowercardById } from "@/lib/powercards";

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
        let itemDetails = null;
        if(currentAuction.status === "open") {
           if (currentAuction.itemType === "powercard") {
               const pc = getPowercardById(currentAuction.puzzleId);
               if (pc) {
                 itemDetails = {
                   id: pc.id,
                   title: pc.name,
                   prompt: pc.description,
                   points: pc.cost || 0,
                   image: pc.image || null,
                   timing: pc.timing || null,
                   type: "powercard"
                 };
               }
           } else {
               // Puzzle
               const p = getPuzzleById(currentAuction.puzzleId);
               if(p) {
                 itemDetails = {
                     puzzleId: p.puzzleId,
                     title: p.title,
                     prompt: p.prompt,
                     points: p.points,
                     type: "puzzle"
                 }
               }
           }
        }

      const teamBidIndex = currentAuction.bids.findIndex(
        (b) => b.teamId.toString() === team._id.toString()
      );

      auctionInfo = {
        auctionId: currentAuction._id,
        puzzleId: currentAuction.puzzleId,
        itemType: currentAuction.itemType || "puzzle",
        puzzle: itemDetails, // keeping the key 'puzzle' for frontend compatibility but can contain powercard
        status: currentAuction.status,
        hasBid: teamBidIndex > -1,
        myBid: teamBidIndex > -1 ? currentAuction.bids[teamBidIndex].amount : null,
        winnerTeamName: currentAuction.winnerTeamId ? currentAuction.winnerTeamId.teamName : null,
        winningBid: currentAuction.winningBid,
      };
    }

    // Resolve powercards
    const ownedPowercards = (team.assignedPowercardIds || []).map(id => getPowercardById(id)).filter(Boolean);

    return NextResponse.json({
      status: team.status,
      currency: team.currency,
      ownedPowercards,
      auction: auctionInfo,
    });
  } catch (err) {
    console.error("Auction state error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
