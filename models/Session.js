import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "started", "ended"],
      default: "pending",
    },
    createdBy: { type: String, default: "admin" },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    // assignments: map of teamName -> [puzzleId]
    assignments: {
      type: Map,
      of: [String],
      default: {},
    },
    teamNames: [{ type: String }],
    maxPuzzlesPerTeam: { type: Number, default: 5 },
  },
  { timestamps: true },
);

export default mongoose.models.Session || mongoose.model("Session", SessionSchema);
