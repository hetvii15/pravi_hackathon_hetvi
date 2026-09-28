import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Seed structure only (departments/categories are fixed product configuration,
// not fabricated business data). Live asset counts per department will come
// from the database layer.
const DEPARTMENTS = [
  { name: "Road & Building", code: "RB", categories: ["Road", "Bridge", "Government Building"] },
  { name: "Water", code: "WTR", categories: ["Pipeline", "Pump", "Reservoir"] },
  { name: "Drainage", code: "DRN", categories: ["Drain", "Manhole"] },
  { name: "Street Lighting", code: "SL", categories: ["Streetlight", "Transformer"] },
  { name: "Traffic", code: "TRF", categories: ["Traffic Signal", "CCTV Camera"] },
];

export default function DepartmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="The departments and asset categories that structure the inventory. New departments and categories can be added without code changes."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {DEPARTMENTS.map((dept) => (
          <Card key={dept.code}>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Building2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">{dept.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{dept.code} · — assets</p>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {dept.categories.map((c) => (
                <Badge key={c} variant="outline" className="font-normal text-muted-foreground">
                  {c}
                </Badge>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
