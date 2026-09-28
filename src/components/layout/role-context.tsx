"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Role } from "@/lib/constants";

// Real, cookie-backed session (see src/lib/session.ts) — no more client-side
// role switching. The logged-in user is read server-side in
// src/app/(app)/layout.tsx and handed down here as the value for the
// lifetime of this render tree; it changes only by logging in/out.

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

const RoleContext = createContext<SessionUser | null>(null);

export function RoleProvider({ user, children }: { user: SessionUser; children: ReactNode }) {
  return <RoleContext.Provider value={user}>{children}</RoleContext.Provider>;
}

// Returns the logged-in user, e.g. `const { role } = useRole();`
export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
