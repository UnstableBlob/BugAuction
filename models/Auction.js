import mongoose from "mongoose";

const AuctionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    puzzleId: {
      type: String, // String ID matching Puzzle or Powercard model
      required: true,
    },
    itemType: {
      type: String,
      enum: ["puzzle", "powercard"],
      default: "puzzle",
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    bids: [
      {
        teamId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Team",
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    winnerTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    winningBid: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Auction || mongoose.model("Auction", AuctionSchema);
