import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["waiting", "started", "ended"],
      default: "waiting",
    },
    durationMinutes: { type: Number, default: 90 },
    startTime: { type: Date, default: null },
    teamNames: [{ type: String }],
    puzzlesPerTeam: { type: Number, default: 5 },
  },
  { timestamps: true },
);

export default mongoose.models.Room || mongoose.model("Room", RoomSchema);
