import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ROLES, type Role } from "@/lib/constants";
import { forbidden } from "@/server/errors";
import { getSessionFromRequest } from "@/lib/session";

// Infra360 now has a real (if lightweight) login — see src/app/login/** and
// src/lib/session.ts. The role used to authorize a mutating request is read
// server-side from the session cookie, which is authoritative; the older
// `x-demo-role` header is kept only as a fallback for direct API calls made
// without a browser session (curl, scripts, tooling), and defaults to
// GOVERNMENT_ADMIN when neither is present.

export function getRequestRole(request: NextRequest): Role {
  const session = getSessionFromRequest(request);
  if (session) return session.role;

  const header = request.headers.get("x-demo-role");
  if (header && (ROLES as readonly string[]).includes(header)) return header as Role;

  return "GOVERNMENT_ADMIN";
}

// The concrete actor to attribute a mutation to (audit logs, inspector,
// notifications). Prefers the real logged-in user's id; falls back to "first
// seeded user with this role" only when there's no session (tooling/testing).
export async function getActingUserId(request: NextRequest): Promise<string | null> {
  const session = getSessionFromRequest(request);
  if (session) return session.id;

  const role = getRequestRole(request);
  const user = await prisma.user.findFirst({ where: { role } });
  return user?.id ?? null;
}

export function requireRole(role: Role, allowed: Role[]) {
  if (!allowed.includes(role)) {
    throw forbidden(
      `This action requires one of: ${allowed.join(", ")}. Current demo role is ${role}.`
    );
  }
}

export const ADMIN_ONLY: Role[] = ["GOVERNMENT_ADMIN"];
export const ASSET_WRITE_ROLES: Role[] = ["GOVERNMENT_ADMIN", "DEPARTMENT_MANAGER"];
export const INSPECTION_WRITE_ROLES: Role[] = ["GOVERNMENT_ADMIN", "INSPECTOR"];
export const MAINTENANCE_WRITE_ROLES: Role[] = ["GOVERNMENT_ADMIN", "MAINTENANCE_OFFICER"];
