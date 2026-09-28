import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureList } from "@/components/feature-list";
import { ConditionBadge, CriticalityBadge } from "@/components/status-badge";
import { NewInspectionDialog } from "@/components/inspections/new-inspection-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function InspectionsPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const overdueWhere = {
    OR: [{ nextInspectionDate: { lt: now } }, { nextInspectionDate: null }],
  };

  const [inspections, assets, overdueAssets, totalInspections, inspectionsThisMonth] =
    await Promise.all([
      prisma.inspection.findMany({
        orderBy: { inspectionDate: "desc" },
        take: 100,
        include: {
          asset: { select: { id: true, assetCode: true, name: true } },
          inspector: { select: { name: true } },
        },
      }),
      prisma.asset.findMany({
        select: { id: true, assetCode: true, name: true },
        orderBy: { name: "asc" },
        take: 300,
      }),
      prisma.asset.findMany({
        where: overdueWhere,
        orderBy: { nextInspectionDate: "asc" },
        take: 20,
        select: {
          id: true,
          assetCode: true,
          name: true,
          criticality: true,
          nextInspectionDate: true,
          lastInspectionDate: true,
          department: { select: { name: true } },
        },
      }),
      prisma.inspection.count(),
      prisma.inspection.count({ where: { inspectionDate: { gte: startOfMonth } } }),
    ]);

  const overdueCount = overdueAssets.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inspections"
        description="Inspection history and schedule across every asset, with overdue inspections surfaced automatically."
        actions={<NewInspectionDialog assets={assets} />}
      />

      <Card>
        <CardContent className="py-5">
          <FeatureList
            items={[
              "Condition, safety, structural and operational scores recorded per inspection",
              "Inspector, findings and recommendations captured for every visit",
              "Assets with overdue next-inspection dates flagged automatically",
              "Inspection history feeds directly into each asset's risk score",
            ]}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Total Inspections</p>
            <p className="text-2xl font-semibold tabular-nums">{totalInspections}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Overdue / Requiring Inspection</p>
            <p className="text-2xl font-semibold tabular-nums">{overdueCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Inspections This Month</p>
            <p className="text-2xl font-semibold tabular-nums">{inspectionsThisMonth}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overdue / Requiring Inspection</CardTitle>
        </CardHeader>
        {overdueAssets.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Criticality</TableHead>
                  <TableHead>Last Inspection</TableHead>
                  <TableHead>Next Inspection</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueAssets.map((asset) => {
                  const isOverdue = asset.nextInspectionDate !== null && asset.nextInspectionDate < now;
                  return (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <Link href={`/assets/${asset.id}`} className="hover:underline">
                          <span className="font-medium">{asset.assetCode}</span>
                          <span className="text-muted-foreground"> — {asset.name}</span>
                        </Link>
                      </TableCell>
                      <TableCell>{asset.department?.name ?? "—"}</TableCell>
                      <TableCell>
                        <CriticalityBadge criticality={asset.criticality} />
                      </TableCell>
                      <TableCell>
                        {asset.lastInspectionDate ? format(asset.lastInspectionDate, "MMM d, yyyy") : "Never"}
                      </TableCell>
                      <TableCell
                        className={
                          asset.nextInspectionDate === null
                            ? "text-amber-700"
                            : isOverdue
                              ? "text-red-700"
                              : undefined
                        }
                      >
                        {asset.nextInspectionDate ? format(asset.nextInspectionDate, "MMM d, yyyy") : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <CardContent className="border-t">
            <EmptyState
              icon={AlertTriangle}
              title="Nothing overdue"
              description="Every asset is within its scheduled inspection window. Overdue or never-inspected assets will appear here."
            />
          </CardContent>
        )}
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Inspected By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Condition Score</TableHead>
                <TableHead>Findings</TableHead>
              </TableRow>
            </TableHeader>
            {inspections.length > 0 && (
              <TableBody>
                {inspections.map((inspection) => (
                  <TableRow key={inspection.id}>
                    <TableCell>
                      <Link href={`/assets/${inspection.asset.id}`} className="hover:underline">
                        <span className="font-medium">{inspection.asset.assetCode}</span>
                        <span className="text-muted-foreground"> — {inspection.asset.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell>{inspection.inspector?.name ?? "—"}</TableCell>
                    <TableCell>{format(inspection.inspectionDate, "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <ConditionBadge score={inspection.conditionScore} />
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {inspection.comments ?? inspection.recommendations ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
        </div>
        {inspections.length === 0 && (
          <CardContent className="border-t">
            <EmptyState
              icon={AlertTriangle}
              title="No inspections recorded yet"
              description="Logged inspections will appear here, ordered by most recent, with overdue assets highlighted at the top."
            />
          </CardContent>
        )}
      </Card>
    </div>
  );
}
