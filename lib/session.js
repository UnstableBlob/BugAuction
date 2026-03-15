import jwt from "jsonwebtoken";
import { serialize, parse } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const COOKIE_NAME_TEAM = "paraallax_team";
const COOKIE_NAME_ADMIN = "paraallax_admin";
const MAX_AGE = 60 * 60 * 8; // 8 hours

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: MAX_AGE });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function setTeamCookie(res, teamName) {
  const token = signToken({ teamName, role: "team" });
  res.headers.set(
    "Set-Cookie",
    serialize(COOKIE_NAME_TEAM, token, {
      httpOnly: true,
      path: "/",
      maxAge: MAX_AGE,
      sameSite: "lax",
    }),
  );
}

export function setAdminCookie(res, email) {
  const token = signToken({ email, role: "admin" });
  res.headers.set(
    "Set-Cookie",
    serialize(COOKIE_NAME_ADMIN, token, {
      httpOnly: true,
      path: "/",
      maxAge: MAX_AGE,
      sameSite: "lax",
    }),
  );
}

export function clearTeamCookie(res) {
  res.headers.set(
    "Set-Cookie",
    serialize(COOKIE_NAME_TEAM, "", { httpOnly: true, path: "/", maxAge: 0 }),
  );
}

export function getTeamTokenFromRequest(req) {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = parse(cookieHeader);
  return cookies[COOKIE_NAME_TEAM] || null;
}

export function getAdminTokenFromRequest(req) {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = parse(cookieHeader);
  return cookies[COOKIE_NAME_ADMIN] || null;
}
