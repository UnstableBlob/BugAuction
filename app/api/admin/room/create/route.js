import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Room from "@/models/Room";
import Team from "@/models/Team";

export async function POST(req) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { teamNames, puzzlesPerTeam } = await req.json();
    if (!teamNames || !Array.isArray(teamNames) || teamNames.length === 0) {
      return NextResponse.json(
        { error: "teamNames array required" },
        { status: 400 },
      );
    }
    if (!puzzlesPerTeam || puzzlesPerTeam < 1) {
      return NextResponse.json(
        { error: "puzzlesPerTeam must be >= 1" },
        { status: 400 },
      );
    }

    await connectDB();

    const room = await Room.create({
      status: "waiting",
      teamNames,
      puzzlesPerTeam: Number(puzzlesPerTeam),
    });

    // Link teams to this room
    await Team.updateMany(
      { teamName: { $in: teamNames } },
      { activeRoomId: room._id },
    );

    return NextResponse.json({ success: true, roomId: room._id });
  } catch (err) {
    console.error("Create room error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
