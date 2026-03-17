import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";

export async function POST(req) {
  try {
    const { puzzleId, teamId } = await req.json();

    if (!puzzleId || !teamId) {
      return NextResponse.json({ error: "puzzleId and teamId are required" }, { status: 400 });
    }

    await connectDB();

    // Re-assignment logic: 
    // Find the team currently holding this puzzle (if any).
    const existingAssignment = await Team.findOne({ assignedPuzzleIds: puzzleId });
    
    if (existingAssignment) {
      if (existingAssignment._id.toString() === teamId) {
        return NextResponse.json({ success: true, teamName: existingAssignment.teamName, message: "Already assigned to this team" });
      }
      
      // Remove puzzle from current team's list
      existingAssignment.assignedPuzzleIds = existingAssignment.assignedPuzzleIds.filter(id => id !== puzzleId);
      await existingAssignment.save();
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Add puzzleId to new team's list
    team.assignedPuzzleIds.push(puzzleId);
    await team.save();

    return NextResponse.json({ success: true, teamName: team.teamName });
  } catch (error) {
    console.error("Error assigning puzzle:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
