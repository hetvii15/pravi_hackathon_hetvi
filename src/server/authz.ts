import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ROLES, type Role } from "@/lib/constants";
import { forbidden } from "@/server/errors";

// Infra360 has lightweight, role-aware DEMO auth only (see
// src/components/layout/role-context.tsx) — there is no login/session.
// The client sends the demo role it's currently switched to via the
// `x-demo-role` header; this resolves it to a real seeded User row so
// mutations have a concrete actor to attribute (audit logs, inspector,
// notifications). This is NOT a security boundary — it exists so the
// role-based rules below are readable and enforced consistently server-side
// rather than only hidden/shown in the UI.

export function getRequestRole(request: NextRequest): Role {
  const header = request.headers.get("x-demo-role");
  if (header && (ROLES as readonly string[]).includes(header)) return header as Role;
  return "GOVERNMENT_ADMIN"; // sensible default for direct/API-tool calls without the header
}

export async function getActingUser(role: Role) {
  const user = await prisma.user.findFirst({ where: { role } });
  return user; // may be null if that role wasn't seeded; callers handle null userId gracefully
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
