"use client";

import { LogOut } from "lucide-react";
import { useRole } from "@/components/layout/role-context";
import { ROLE_META } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/login/actions";

export function RoleSettings() {
  const { name, email, role } = useRole();

  return (
    <div className="space-y-4">
      <p className="max-w-xl text-sm text-muted-foreground">
        You&rsquo;re signed in with one of Infra360&rsquo;s demo accounts. Each account maps to a
        real role — API requests are authorized server-side against your session, not a
        client-editable setting.
      </p>
      <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2 sm:max-w-md">
        <div className="flex items-center justify-between border-b pb-1.5 sm:col-span-2">
          <span className="text-muted-foreground">Name</span>
          <span className="font-medium">{name}</span>
        </div>
        <div className="flex items-center justify-between border-b pb-1.5 sm:col-span-2">
          <span className="text-muted-foreground">Email</span>
          <span className="font-medium">{email}</span>
        </div>
        <div className="flex items-center justify-between border-b pb-1.5 sm:col-span-2">
          <span className="text-muted-foreground">Role</span>
          <span className="font-medium">{ROLE_META[role].label}</span>
        </div>
      </div>
      <form action={logoutAction}>
        <Button type="submit" variant="outline" size="sm">
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </form>
    </div>
  );
}
