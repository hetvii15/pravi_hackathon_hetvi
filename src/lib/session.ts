import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { Role } from "@/lib/constants";

// Lightweight, demo-only session: an httpOnly cookie holding the logged-in
// user's identity as plain base64 JSON. Not cryptographically signed — this
// keeps the project's existing "lightweight demo auth, not a security
// boundary" stance, just backed by a real login/logout flow instead of a
// free client-side role switch.

export const SESSION_COOKIE = "infra360_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

function encode(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user), "utf-8").toString("base64url");
}

function decode(value: string): SessionUser | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf-8"));
    if (
      parsed &&
      typeof parsed.id === "string" &&
      typeof parsed.name === "string" &&
      typeof parsed.email === "string" &&
      typeof parsed.role === "string"
    ) {
      return parsed as SessionUser;
    }
    return null;
  } catch {
    return null;
  }
}

// Server Components / Server Actions — reads the request's cookie jar.
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  return raw ? decode(raw) : null;
}

// Route Handlers receive a NextRequest instead of the cookies() helper.
export function getSessionFromRequest(request: NextRequest): SessionUser | null {
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  return raw ? decode(raw) : null;
}

export async function createSession(user: SessionUser) {
  const store = await cookies();
  store.set(SESSION_COOKIE, encode(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
