"use client";

import { useRole } from "@/components/layout/role-context";
import { ROLES, ROLE_META } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RoleSettings() {
  const { role, setRole } = useRole();

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground max-w-xl">
        Infra360 uses lightweight, role-aware demo access — there is no backend login. Switching
        roles here changes which actions the UI exposes, so reviewers can see the product from
        different vantage points without needing real accounts.
      </p>
      <div className="flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <Button
            key={r}
            variant={r === role ? "default" : "outline"}
            size="sm"
            onClick={() => setRole(r)}
            className={cn(r === role && "pointer-events-none")}
          >
            {ROLE_META[r].label}
          </Button>
        ))}
      </div>
    </div>
  );
}
