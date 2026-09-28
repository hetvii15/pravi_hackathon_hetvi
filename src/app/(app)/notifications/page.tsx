import Link from "next/link";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { NOTIFICATION_TYPES, NOTIFICATION_TYPE_META } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { listNotifications } from "@/server/notifications";
import { NotificationToggle } from "@/components/notification-toggle";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const result = await listNotifications({ pageSize: 50 });

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

      {result.data.length === 0 ? (
        <Card>
          <CardContent className="py-5">
            <EmptyState
              icon={Bell}
              title="No notifications yet"
              description="Notifications generate automatically from asset state — an inspection going overdue, maintenance coming due, or an asset crossing into critical risk."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {result.data.map((n) => (
            <Card key={n.id}>
              <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={NOTIFICATION_TYPE_META[n.type].className}>
                      {NOTIFICATION_TYPE_META[n.type].label}
                    </Badge>
                    <span
                      className={cn(
                        "text-sm",
                        n.isRead ? "text-muted-foreground" : "font-semibold text-foreground"
                      )}
                    >
                      {n.title}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {n.asset && (
                      <Link href={`/assets/${n.asset.id}`} className="font-medium text-primary hover:underline">
                        {n.asset.assetCode}
                      </Link>
                    )}
                    <span>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
                <NotificationToggle id={n.id} isRead={n.isRead} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
