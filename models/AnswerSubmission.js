import mongoose from "mongoose";

const AnswerSubmissionSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      index: true,
    },
    teamName: { type: String, required: true, index: true },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null,
      index: true,
    },
    puzzleId: { type: String, required: true, index: true },
    answer: { type: mongoose.Schema.Types.Mixed, required: true },
    submittedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

export default mongoose.models.AnswerSubmission ||
  mongoose.model("AnswerSubmission", AnswerSubmissionSchema);
