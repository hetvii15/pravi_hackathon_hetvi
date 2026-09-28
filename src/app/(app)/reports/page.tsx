import { FileBarChart, TrendingUp, PiggyBank } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
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
            <EmptyState
              icon={PiggyBank}
              title="No spend data yet"
              description="Acquisition and maintenance cost, rolled up by department, will chart here."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Condition Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={TrendingUp}
              title="No trend data yet"
              description="Average condition score over time, tracked from inspection history."
            />
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
