import { Boxes, AlertTriangle, ClipboardCheck, Activity } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/kpi-card";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Portfolio-wide view of asset health, risk and operational activity across every department."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Assets" value="—" icon={Boxes} accent="info" hint="Pending database layer" />
        <KpiCard label="Critical Risk" value="—" icon={AlertTriangle} accent="bad" hint="Pending database layer" />
        <KpiCard label="Overdue Inspections" value="—" icon={ClipboardCheck} accent="warn" hint="Pending database layer" />
        <KpiCard label="Avg. Condition Score" value="—" icon={Activity} accent="good" hint="Pending database layer" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Assets by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={BarChart3}
              title="Chart will render once assets are seeded"
              description="Distribution of assets across Road & Building, Water, Drainage, Street Lighting and Traffic."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Condition Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={PieChartIcon}
              title="Chart will render once assets are seeded"
              description="Share of assets in Excellent, Good, Fair, Poor and Critical condition bands."
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Attention Needed</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={AlertTriangle}
            title="No data connected yet"
            description="High-risk assets, overdue inspections and assets approaching end-of-life will be ranked here as soon as the database layer is wired in."
            note="This panel intentionally shows no fabricated numbers."
          />
        </CardContent>
      </Card>
    </div>
  );
}
