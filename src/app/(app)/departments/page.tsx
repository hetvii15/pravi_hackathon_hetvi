import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listDepartments } from "@/server/departments";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const departments = await listDepartments();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="The departments and asset categories that structure the inventory. New departments and categories can be added without code changes."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {departments.map((dept) => (
          <Card key={dept.id}>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Building2 className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm font-medium">{dept.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {dept.code} · {dept.assetCount.toLocaleString("en-IN")} assets
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {dept.categories.map((c) => (
                  <Badge key={c.id} variant="outline" className="font-normal text-muted-foreground">
                    {c.name}
                  </Badge>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t pt-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Avg. condition</span>
                  <span className="font-medium tabular-nums">{Math.round(dept.avgConditionScore)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">High risk</span>
                  <span className="font-medium tabular-nums">{dept.highRiskCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Maintenance due</span>
                  <span className="font-medium tabular-nums">{dept.maintenanceDueCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Overdue inspections</span>
                  <span className="font-medium tabular-nums">{dept.overdueInspectionCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
