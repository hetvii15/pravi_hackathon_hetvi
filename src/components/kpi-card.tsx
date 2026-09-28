import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "neutral",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  accent?: "neutral" | "good" | "warn" | "bad" | "info";
}) {
  const accentClasses: Record<typeof accent, string> = {
    neutral: "bg-muted text-muted-foreground",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-red-50 text-red-700",
    info: "bg-blue-50 text-blue-700",
  };

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 py-5">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", accentClasses[accent])}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </CardContent>
    </Card>
  );
}
