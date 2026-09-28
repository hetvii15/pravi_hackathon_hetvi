"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ROLES, ROLE_META, type Role } from "@/lib/constants";

// Lightweight, role-aware DEMO authentication only. There is no backend
// session/login flow — the selected role is stored client-side and used to
// show/hide UI affordances (e.g. "Add Asset"). Real auth is out of scope
// for the hackathon build; swap this context for a server session once
// the database layer exposes a User/session model.

const STORAGE_KEY = "infra360-demo-role";
const DEFAULT_ROLE: Role = "GOVERNMENT_ADMIN";

type RoleContextValue = {
  role: Role;
  setRole: (role: Role) => void;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(DEFAULT_ROLE);

  useEffect(() => {
    // One-time sync from localStorage after mount: state must start at
    // DEFAULT_ROLE on both server and client to avoid a hydration mismatch,
    // so reading the real stored value can only happen post-mount.
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (ROLES as readonly string[]).includes(stored)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRoleState(stored as Role);
      }
    } catch {
      // localStorage unavailable (private mode, etc.) — fall back silently.
    }
  }, []);

  function setRole(next: Role) {
    setRoleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore write failures
    }
  }

  return (
    <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}

export function roleLabel(role: Role) {
  return ROLE_META[role].label;
}
