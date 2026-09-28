"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Bell, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav";
import { ROLE_META } from "@/lib/constants";
import { useRole } from "@/components/layout/role-context";
import { logoutAction } from "@/app/login/actions";

export function Topbar() {
  const pathname = usePathname();
  const { name, role } = useRole();
  const current = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background px-4 md:px-6">
      <Sheet>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-sidebar text-sidebar-foreground p-0">
          <SheetHeader className="border-b border-sidebar-border">
            <SheetTitle className="flex items-center gap-2 text-sidebar-foreground">
              <ShieldCheck className="h-4.5 w-4.5" />
              Infra360
            </SheetTitle>
          </SheetHeader>
          <nav className="p-2 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{current?.label ?? "Infra360"}</p>
        {current && (
          <p className="text-xs text-muted-foreground truncate hidden sm:block">
            {current.description}
          </p>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        render={<Link href="/notifications" aria-label="Notifications" />}
      >
        <Bell className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-2 pl-1">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden leading-tight sm:block">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{ROLE_META[role].label}</p>
        </div>
        <form action={logoutAction}>
          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon" type="submit" aria-label="Log out" />}>
              <LogOut className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Log out</TooltipContent>
          </Tooltip>
        </form>
      </div>
    </header>
  );
}
