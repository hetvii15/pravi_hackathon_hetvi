import Link from "next/link";
import { format } from "date-fns";
import {
  Boxes,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  ShieldAlert,
  BarChart3,
  PieChart as PieChartIcon,
  ClipboardCheck,
  Map as MapIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/kpi-card";
import { EmptyState } from "@/components/empty-state";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AssetsByDepartmentChart } from "@/components/charts/assets-by-department-chart";
import { ConditionDistributionChart } from "@/components/charts/condition-distribution-chart";
import { WorkOrderStatusBadge } from "@/components/status-badge";
import { AssetMapLoader } from "@/components/map/asset-map-loader";
import type { MapAsset } from "@/components/map/asset-map";
import { getDashboardMetrics } from "@/server/dashboard";
import { prisma } from "@/lib/prisma";
import { WORK_ORDER_PRIORITY_META, riskBand } from "@/lib/constants";

export const dynamic = "force-dynamic";

function daysOverdue(date: Date | string) {
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
}

export default async function DashboardPage() {
  const [metrics, mapAssetsRaw] = await Promise.all([
    getDashboardMetrics(),
    prisma.asset.findMany({
      select: {
        id: true,
        assetCode: true,
        name: true,
        description: true,
        latitude: true,
        longitude: true,
        address: true,
        zone: true,
        status: true,
        conditionScore: true,
        criticality: true,
        riskScore: true,
        lifecycleStage: true,
        departmentId: true,
        categoryId: true,
        department: { select: { name: true } },
        category: { select: { name: true } },
      },
      take: 100,
    }),
  ]);

  const mapAssets: MapAsset[] = mapAssetsRaw.map((a) => ({
    id: a.id,
    assetCode: a.assetCode,
    name: a.name,
    description: a.description,
    latitude: a.latitude,
    longitude: a.longitude,
    address: a.address,
    zone: a.zone,
    status: a.status,
    conditionScore: a.conditionScore,
    criticality: a.criticality,
    riskScore: a.riskScore,
    lifecycleStage: a.lifecycleStage,
    departmentId: a.departmentId,
    categoryId: a.categoryId,
    departmentName: a.department.name,
    categoryName: a.category.name,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Portfolio-wide view of asset health, risk and operational activity across every department."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Total Assets"
          value={metrics.totalAssets.toLocaleString("en-IN")}
          icon={Boxes}
          accent="info"
        />
        <KpiCard
          label="Operational"
          value={metrics.operationalAssets.toLocaleString("en-IN")}
          icon={CheckCircle2}
          accent="good"
          hint={metrics.totalAssets > 0 ? `${Math.round((metrics.operationalAssets / metrics.totalAssets) * 100)}% of total` : undefined}
        />
        <KpiCard
          label="Maintenance Due"
          value={metrics.maintenanceDue.toLocaleString("en-IN")}
          icon={Wrench}
          accent="warn"
        />
        <KpiCard
          label="High Risk"
          value={metrics.highRiskAssets.toLocaleString("en-IN")}
          icon={AlertTriangle}
          accent="warn"
          hint="Risk score ≥ 50"
        />
        <KpiCard
          label="Critical"
          value={metrics.criticalAssets.toLocaleString("en-IN")}
          icon={ShieldAlert}
          accent="bad"
          hint="Risk score ≥ 75"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Assets by Department</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.assetsByDepartment.length > 0 ? (
              <AssetsByDepartmentChart data={metrics.assetsByDepartment} />
            ) : (
              <EmptyState
                icon={BarChart3}
                title="Chart will render once assets are seeded"
                description="Distribution of assets across Road & Building, Water, Drainage, Street Lighting and Traffic."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Condition Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.totalAssets > 0 ? (
              <ConditionDistributionChart data={metrics.conditionDistribution} />
            ) : (
              <EmptyState
                icon={PieChartIcon}
                title="Chart will render once assets are seeded"
                description="Share of assets in Excellent, Good, Fair, Poor and Critical condition bands."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Critical Assets</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.topRiskAssets.length > 0 ? (
            <div className="divide-y">
              {metrics.topRiskAssets.map((asset) => {
                const band = riskBand(asset.riskScore);
                return (
                  <Link
                    key={asset.id}
                    href={`/assets/${asset.id}`}
                    className="-mx-(--card-spacing) flex flex-wrap items-center justify-between gap-2 px-(--card-spacing) py-2.5 hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium hover:underline">{asset.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {asset.assetCode} · {asset.department.name}
                      </p>
                    </div>
                    <Badge variant="outline" className={band.className}>
                      {band.label} · {Math.round(asset.riskScore)}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={AlertTriangle}
              title="No high-risk assets"
              description="Assets with elevated risk scores will be ranked here as soon as they're seeded or flagged."
            />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Upcoming Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.upcomingMaintenance.length > 0 ? (
              <div className="divide-y">
                {metrics.upcomingMaintenance.map((wo) => (
                  <div key={wo.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{wo.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {wo.asset.assetCode} · {wo.asset.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={WORK_ORDER_PRIORITY_META[wo.priority].className}>
                        {WORK_ORDER_PRIORITY_META[wo.priority].label}
                      </Badge>
                      <WorkOrderStatusBadge status={wo.status} />
                      {wo.dueDate && (
                        <span className="text-xs text-muted-foreground">{format(new Date(wo.dueDate), "MMM d, yyyy")}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Wrench}
                title="No upcoming maintenance"
                description="Open work orders with a due date will be listed here."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Overdue Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.overdueInspectionsList.length > 0 ? (
              <div className="divide-y">
                {metrics.overdueInspectionsList.map((asset) => (
                  <div key={asset.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <Link href={`/assets/${asset.id}`} className="truncate text-sm font-medium hover:underline">
                        {asset.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {asset.assetCode} · {asset.department.name}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {asset.nextInspectionDate ? daysOverdue(asset.nextInspectionDate) : 0} days overdue
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ClipboardCheck}
                title="No overdue inspections"
                description="Assets past their next-inspection date will be listed here."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="isolate p-0 overflow-hidden">
        <CardHeader className="border-b pt-4">
          <CardTitle className="text-sm font-medium">Asset Map Preview</CardTitle>
          <CardAction>
            <Link href="/map" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              View Full Map
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent className="h-72 p-0">
          {mapAssets.length > 0 ? (
            <AssetMapLoader assets={mapAssets} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <EmptyState
                icon={MapIcon}
                title="No assets to display"
                description="Assets with coordinates will appear on the map once seeded."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
