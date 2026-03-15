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
    durationMinutes: { type: Number, default: 0 },
    puzzlesPerTeam: { type: Number, default: 5 },
    penaltyMinutes: { type: Number, default: 5 },
    // assignments: map of teamName -> [puzzleId]
    assignments: {
      type: Map,
      of: [String],
      default: {},
    },
    teamNames: [{ type: String }],
  },
  { timestamps: true },
);

export default mongoose.models.Session || mongoose.model("Session", SessionSchema);
