import Link from "next/link";
import { format } from "date-fns";
import { ClipboardList } from "lucide-react";
import { Prisma } from "@prisma/client";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ConditionBadge,
  CriticalityBadge,
  RiskBadge,
} from "@/components/status-badge";
import {
  ASSET_STATUSES,
  STATUS_META,
  CRITICALITY_LEVELS,
  CRITICALITY_META,
  type AssetStatus,
  type Criticality,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { calculateAssetRisk } from "@/server/risk";
import { getRecommendedAction } from "@/server/recommendations";

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Plain, dependency-free <select> styling that echoes the Input/Button
// components' look without pulling in the shadcn Select (which needs a
// client component to wire up onValueChange). This form submits via a
// normal GET, so the whole page stays a server component.
const selectClassName =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export default async function MaintenancePrioritiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const departmentId = firstValue(rawParams.department) || undefined;
  const categoryId = firstValue(rawParams.category) || undefined;
  const statusParam = firstValue(rawParams.status) || undefined;
  const criticalityParam = firstValue(rawParams.criticality) || undefined;

  const status =
    statusParam && (ASSET_STATUSES as readonly string[]).includes(statusParam)
      ? (statusParam as AssetStatus)
      : undefined;
  const criticality =
    criticalityParam && (CRITICALITY_LEVELS as readonly string[]).includes(criticalityParam)
      ? (criticalityParam as Criticality)
      : undefined;

  const where: Prisma.AssetWhereInput = {};
  if (departmentId) where.departmentId = departmentId;
  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;
  if (criticality) where.criticality = criticality;

  const [assets, maintenanceCounts, departments] = await Promise.all([
    prisma.asset.findMany({
      where,
      orderBy: { riskScore: "desc" },
      take: 100,
      select: {
        id: true,
        assetCode: true,
        name: true,
        status: true,
        conditionScore: true,
        criticality: true,
        riskScore: true,
        lastInspectionDate: true,
        nextInspectionDate: true,
        departmentId: true,
        categoryId: true,
        department: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.maintenanceRecord.groupBy({
      by: ["assetId"],
      where: { maintenanceType: { in: ["CORRECTIVE", "EMERGENCY"] } },
      _count: true,
    }),
    prisma.department.findMany({
      include: { categories: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const correctiveOrEmergencyCountByAssetId = new Map(
    maintenanceCounts.map((group) => [group.assetId, group._count])
  );

  const rows = assets.map((asset) => {
    const correctiveOrEmergencyCount = correctiveOrEmergencyCountByAssetId.get(asset.id) ?? 0;
    const riskInput = {
      conditionScore: asset.conditionScore,
      criticality: asset.criticality,
      status: asset.status,
      nextInspectionDate: asset.nextInspectionDate,
      correctiveOrEmergencyCount,
    };
    const risk = calculateAssetRisk(riskInput);
    const recommendedAction = getRecommendedAction(riskInput);
    return { asset, risk, recommendedAction };
  });

  const allCategories = departments.flatMap((d) => d.categories);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Priorities"
        description="Assets ranked by risk — a transparent, rule-based decision-support view, not a prediction."
        actions={
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Prototype Decision Support
          </Badge>
        }
      />

      <Card>
        <CardContent className="py-4">
          <form className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center" method="get">
            <select
              name="department"
              defaultValue={departmentId ?? ""}
              className={selectClassName}
              aria-label="Filter by department"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              name="category"
              defaultValue={categoryId ?? ""}
              className={selectClassName}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {allCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              name="status"
              defaultValue={status ?? ""}
              className={selectClassName}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {ASSET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>

            <select
              name="criticality"
              defaultValue={criticality ?? ""}
              className={selectClassName}
              aria-label="Filter by criticality"
            >
              <option value="">All criticality</option>
              {CRITICALITY_LEVELS.map((c) => (
                <option key={c} value={c}>
                  {CRITICALITY_META[c].label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <Button type="submit" size="sm">
                Apply Filters
              </Button>
              <Link href="/maintenance/priorities" className="text-sm text-muted-foreground hover:underline">
                Clear
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Criticality</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Last Inspection</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Recommended Action</TableHead>
              </TableRow>
            </TableHeader>
            {rows.length > 0 && (
              <TableBody>
                {rows.map(({ asset, risk, recommendedAction }) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <Link href={`/assets/${asset.id}`} className="hover:underline">
                        <span className="block font-mono text-xs text-muted-foreground">{asset.assetCode}</span>
                        <span className="font-medium">{asset.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell>{asset.department.name}</TableCell>
                    <TableCell>{asset.category.name}</TableCell>
                    <TableCell>
                      <ConditionBadge score={asset.conditionScore} />
                    </TableCell>
                    <TableCell>
                      <CriticalityBadge criticality={asset.criticality} />
                    </TableCell>
                    <TableCell>
                      <RiskBadge score={risk.riskScore} />
                    </TableCell>
                    <TableCell>
                      {asset.lastInspectionDate ? format(asset.lastInspectionDate, "MMM d, yyyy") : "Never"}
                    </TableCell>
                    <TableCell className="max-w-xs whitespace-normal text-sm text-muted-foreground">
                      {risk.reasons.slice(0, 2).join("; ")}
                    </TableCell>
                    <TableCell className="max-w-xs whitespace-normal">
                      <Badge variant="outline" className="whitespace-normal text-left font-normal">
                        {recommendedAction}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
        </div>

        {rows.length === 0 && (
          <CardContent className="border-t">
            <EmptyState
              icon={ClipboardList}
              title="No assets found"
              description="No assets match the current filters. Try adjusting your search or filter criteria."
            />
          </CardContent>
        )}
      </Card>
    </div>
  );
}
