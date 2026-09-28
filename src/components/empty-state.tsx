import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  icon: Icon,
  title,
  description,
  note,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  note?: string;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
        {note && <p className="text-xs text-muted-foreground/70 mt-1">{note}</p>}
      </CardContent>
    </Card>
  );
}
