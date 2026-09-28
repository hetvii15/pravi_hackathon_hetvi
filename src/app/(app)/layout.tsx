import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { RoleProvider } from "@/components/layout/role-context";
import { getSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  // Middleware guarantees a session exists for every (app) route; this
  // fallback only matters for edge cases like local dev without middleware.
  const user = session ?? { id: "", name: "Guest", email: "", role: "GOVERNMENT_ADMIN" as const };

  return (
    <RoleProvider user={user}>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <Topbar />
          <main className="flex-1 p-4 md:p-6 space-y-6">{children}</main>
        </div>
      </div>
    </RoleProvider>
  );
}
