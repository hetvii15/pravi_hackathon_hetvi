import { FileBarChart, PiggyBank } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaintenanceSpendChart } from "@/components/charts/maintenance-spend-chart";
import { RiskDistributionChart } from "@/components/charts/risk-distribution-chart";
import { prisma } from "@/lib/prisma";
import { getDashboardMetrics } from "@/server/dashboard";

// Maintenance spend per department = sum of MaintenanceRecord.cost +
// WorkOrder.actualCost, rolled up through each record's asset relation.
async function getMaintenanceSpendByDepartment() {
  const [maintenanceRecords, workOrders] = await Promise.all([
    prisma.maintenanceRecord.findMany({
      select: { cost: true, asset: { select: { department: { select: { name: true } } } } },
    }),
    prisma.workOrder.findMany({
      select: { actualCost: true, asset: { select: { department: { select: { name: true } } } } },
    }),
  ]);

  const totals = new Map<string, number>();

  for (const record of maintenanceRecords) {
    const dept = record.asset.department.name;
    totals.set(dept, (totals.get(dept) ?? 0) + (record.cost ?? 0));
  }
  for (const workOrder of workOrders) {
    const dept = workOrder.asset.department.name;
    totals.set(dept, (totals.get(dept) ?? 0) + (workOrder.actualCost ?? 0));
  }

  return Array.from(totals.entries())
    .map(([departmentName, totalCost]) => ({ departmentName, totalCost }))
    .sort((a, b) => b.totalCost - a.totalCost);
}

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [maintenanceSpend, metrics] = await Promise.all([
    getMaintenanceSpendByDepartment(),
    getDashboardMetrics(),
  ]);

  const hasSpendData = maintenanceSpend.some((d) => d.totalCost > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Spend, condition and risk reporting for leadership and cross-department decision-making."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Maintenance Spend by Department</CardTitle>
          </CardHeader>
          <CardContent>
            {hasSpendData ? (
              <MaintenanceSpendChart data={maintenanceSpend} />
            ) : (
              <EmptyState
                icon={PiggyBank}
                title="No spend data yet"
                description="Acquisition and maintenance cost, rolled up by department, will chart here."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskDistributionChart data={metrics.riskDistribution} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Exportable Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={FileBarChart}
            title="Report builder coming online with the database layer"
            description="Generate department-level or portfolio-wide reports covering inventory, risk, inspections and spend."
          />
        </CardContent>
      </Card>
    </div>
  );
}
