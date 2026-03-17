import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Puzzle from "@/models/Puzzle";
import Team from "@/models/Team";

export async function GET() {
  try {
    await connectDB();

    const [puzzles, teams] = await Promise.all([
      Puzzle.find({}).lean(),
      Team.find({}).lean()
    ]);

    // Map each puzzle to its assigned teams
    const puzzlesWithAssignments = puzzles.map(puzzle => {
      const assignedTeams = teams.filter(team => 
        team.assignedPuzzleIds && team.assignedPuzzleIds.includes(puzzle.puzzleId)
      ).map(team => ({
        _id: team._id,
        teamName: team.teamName
      }));

      return {
        ...puzzle,
        assignedTeams
      };
    });

    return NextResponse.json({ 
      puzzles: puzzlesWithAssignments,
      allTeams: teams.map(t => ({ _id: t._id, teamName: t.teamName }))
    });
  } catch (error) {
    console.error("Error fetching puzzle assignments:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
