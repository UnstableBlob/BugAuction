import { connectDB } from "@/lib/db";
import {
  getTeamTokenFromRequest,
  getAdminTokenFromRequest,
  verifyToken,
} from "@/lib/session";
import Team from "@/models/Team";
import Admin from "@/models/Admin";

export async function getTeamFromRequest(req) {
  const token = getTeamTokenFromRequest(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== "team") return null;
  await connectDB();
  const team = await Team.findOne({ teamName: payload.teamName });
  return team || null;
}

export async function getAdminFromRequest(req) {
  const token = getAdminTokenFromRequest(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") return null;
  await connectDB();
  const admin = await Admin.findOne({ email: payload.email });
  return admin || null;
}
