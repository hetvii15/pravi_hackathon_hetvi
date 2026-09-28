import { Bell } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { NOTIFICATION_TYPES, NOTIFICATION_TYPE_META } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Overdue inspections, maintenance due dates and critical-risk alerts, surfaced as they happen."
      />

      <Card>
        <CardContent className="flex flex-wrap gap-1.5 py-4">
          {NOTIFICATION_TYPES.map((t) => (
            <Badge key={t} variant="outline" className={NOTIFICATION_TYPE_META[t].className}>
              {NOTIFICATION_TYPE_META[t].label}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-5">
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="Notifications generate automatically from asset state — an inspection going overdue, maintenance coming due, or an asset crossing into critical risk."
          />
        </CardContent>
      </Card>
    </div>
  );
}
