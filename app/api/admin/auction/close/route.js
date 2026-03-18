import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Auction from "@/models/Auction";
import Session from "@/models/Session";
import Team from "@/models/Team";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    const { auctionId } = await req.json();

    if (!auctionId) {
      return NextResponse.json(
        { error: "auctionId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const auction = await Auction.findById(auctionId).populate("sessionId");
    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    if (auction.status === "closed") {
      return NextResponse.json(
        { error: "Auction is already closed" },
        { status: 400 }
      );
    }

    // Determine the winner
    let winnerId = null;
    let winningBidAmount = 0;

    if (auction.bids && auction.bids.length > 0) {
      // Sort by amount descending, then by timestamp ascending
      const sortedBids = auction.bids.sort((a, b) => {
        if (b.amount !== a.amount) {
          return b.amount - a.amount; // Highest amount first
        }
        return new Date(a.timestamp) - new Date(b.timestamp); // Earliest timestamp first
      });

      const winningBid = sortedBids[0];
      winnerId = winningBid.teamId;
      winningBidAmount = winningBid.amount;
    }

    auction.status = "closed";
    auction.winnerTeamId = winnerId;
    auction.winningBid = winningBidAmount;
    await auction.save();

    // Process the winner
    if (winnerId) {
      const winner = await Team.findById(winnerId);
      if (winner) {
        // Deduct currency
        winner.currency -= winningBidAmount;

        // Assign item based on type
        if (auction.itemType === "powercard") {
          if (!winner.assignedPowercardIds.includes(auction.puzzleId)) {
            winner.assignedPowercardIds.push(auction.puzzleId);
          }
        } else {
          // Puzzle — enforce max puzzle cap
          // auction.sessionId is already the populated Session doc — use it directly
          const sessionDoc = auction.sessionId;
          const maxAllowed = (sessionDoc?.maxPuzzlesPerTeam != null) ? sessionDoc.maxPuzzlesPerTeam : 5;
          const currentCount = winner.assignedPuzzleIds?.length || 0;

          console.log(`[AuctionClose] team=${winner.teamName} puzzles=${currentCount} maxAllowed=${maxAllowed}`);

          if (currentCount >= maxAllowed) {
            // Cap reached: still deduct currency but don't assign puzzle
            await winner.save();
            return NextResponse.json({
              message: `Auction closed. Winner has reached the max puzzle limit (${maxAllowed}) — puzzle not assigned.`,
              auction,
              capReached: true,
            });
          }

          if (!winner.assignedPuzzleIds.includes(auction.puzzleId)) {
            winner.assignedPuzzleIds.push(auction.puzzleId);
          }

          // Update session assignments mapping — fetch a fresh doc for write
          const freshSession = await Session.findById(sessionDoc._id);
          if (freshSession) {
            const teamAssignments = freshSession.assignments.get(winner.teamName) || [];
            if (!teamAssignments.includes(auction.puzzleId)) {
              teamAssignments.push(auction.puzzleId);
              freshSession.assignments.set(winner.teamName, teamAssignments);
              await freshSession.save();
            }
          }
        }
        await winner.save();
      }
    }

    return NextResponse.json({
      message: "Auction closed successfully",
      auction,
    });
  } catch (err) {
    console.error("Auction close error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
