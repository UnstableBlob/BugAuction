import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";

export async function POST(req) {
  try {
    const { powercardId, teamId } = await req.json();

    if (!powercardId || !teamId) {
      return NextResponse.json(
        { error: "powercardId and teamId are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Avoid duplicate assignment
    if (team.assignedPowercardIds.includes(powercardId)) {
      return NextResponse.json({
        success: true,
        teamName: team.teamName,
        message: "Already assigned to this team",
      });
    }

    team.assignedPowercardIds.push(powercardId);
    await team.save();

    return NextResponse.json({ success: true, teamName: team.teamName });
  } catch (error) {
    console.error("Error assigning powercard:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
