import mongoose from "mongoose";

const TeamSchema = new mongoose.Schema(
  {
    teamName: { type: String, required: true, unique: true, trim: true },
    password: { type: String, default: null },
    // numeric team id assigned sequentially on creation/login
    tid: { type: Number, unique: true, sparse: true },
    status: {
      type: String,
      enum: ["inactive", "auctioning", "playing", "success", "caught"],
      default: "inactive",
    },
    currency: { type: Number, default: 1000 },
    score: { type: Number, default: 0 },
    activeRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },
    // new: reference to a global Session (one session per event/batch)
    activeSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null,
    },
    // timestamps for login/start — used by admin terminal
    loginTime: { type: Date, default: null },
    assignedPuzzleIds: [{ type: String }],
    assignedPowercardIds: [{ type: String }],
    currentIndex: { type: Number, default: 0 },
    solvedPuzzleIds: [{ type: String }],
    submissionHistory: [{
      puzzleId: String,
      timestamp: { type: Date, default: Date.now },
      // Kept for backward compatibility in admin event log/history.
      isCorrect: { type: Boolean, default: null },
      answer: mongoose.Schema.Types.Mixed,
    }],
    lastLoginAt: { type: Date, default: null },
    finishTime: { type: Date, default: null },
    gameStartTime: { type: Date, default: null },
    // final results (populated when session is stopped)
    finalScore: { type: Number, default: null },
    finalStatus: {
      type: String,
      enum: ["success", "caught", null],
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.models.Team || mongoose.model("Team", TeamSchema);
