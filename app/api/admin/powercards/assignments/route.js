import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import { getAllPowercards } from "@/lib/powercards";

export async function GET() {
  try {
    await connectDB();

    const teams = await Team.find({}).lean();
    const powercards = getAllPowercards();

    // Map each powercard to its assigned teams
    const powercardsWithAssignments = powercards.map((pc) => {
      const assignedTeams = teams
        .filter(
          (team) =>
            team.assignedPowercardIds &&
            team.assignedPowercardIds.includes(pc.id)
        )
        .map((team) => ({
          _id: team._id,
          teamName: team.teamName,
        }));

      return {
        ...pc,
        assignedTeams,
      };
    });

    return NextResponse.json({
      powercards: powercardsWithAssignments,
      allTeams: teams.map((t) => ({ _id: t._id, teamName: t.teamName })),
    });
  } catch (error) {
    console.error("Error fetching powercard assignments:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
