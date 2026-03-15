import mongoose from "mongoose";

const TeamSnapshotSchema = new mongoose.Schema(
    {
        teamName: { type: String, required: true },
        status: { type: String },      // success / caught / playing
        solvedCount: { type: Number, default: 0 },
        totalPuzzles: { type: Number, default: 0 },
        penaltySeconds: { type: Number, default: 0 },
        timeTaken: { type: Number, default: null }, // seconds, null if not finished
        rank: { type: Number, default: null },
    },
    { _id: false }
);

const SessionHistorySchema = new mongoose.Schema(
    {
        sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session" },
        sessionStartedAt: { type: Date, default: null },
        sessionEndedAt: { type: Date, default: null },
        durationMinutes: { type: Number, default: 0 },
        clearedAt: { type: Date, default: Date.now },
        leaderboard: [TeamSnapshotSchema],
    },
    { timestamps: true }
);

export default mongoose.models.SessionHistory ||
    mongoose.model("SessionHistory", SessionHistorySchema);
