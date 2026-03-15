import { NextResponse } from "next/server";
import { getTeamFromRequest } from "@/lib/auth";

export async function GET(req) {
  const team = await getTeamFromRequest(req);
  if (!team) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    teamName: team.teamName,
    status: team.status,
    activeRoomId: team.activeRoomId,
  });
}
