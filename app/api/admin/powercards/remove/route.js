import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";

export async function POST(req) {
  try {
    const { teamId, powercardId } = await req.json();

    if (!teamId || !powercardId) {
      return NextResponse.json(
        { error: "teamId and powercardId are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Remove the powercard
    const index = team.assignedPowercardIds.indexOf(powercardId);
    if (index > -1) {
      team.assignedPowercardIds.splice(index, 1);
      await team.save();
      return NextResponse.json({ message: "Powercard removed successfully" });
    } else {
      return NextResponse.json({ error: "Team doesn't have this powercard" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error removing powercard:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
