import { History } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureList } from "@/components/feature-list";
import { LIFECYCLE_STAGES, LIFECYCLE_META } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export default function LifecyclePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Lifecycle"
        description="Full lifecycle history per asset — from planning through disposal — and portfolio-wide end-of-life forecasting."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Lifecycle Stage Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={History}
              title="No lifecycle data yet"
              description="Once assets are seeded, this chart will show how many assets sit at each lifecycle stage, from Planned through Disposed."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Stages Tracked</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {LIFECYCLE_STAGES.map((stage) => (
              <Badge key={stage} variant="outline" className={LIFECYCLE_META[stage].className}>
                {LIFECYCLE_META[stage].label}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="py-5">
          <FeatureList
            items={[
              "Every stage transition timestamped with who made the change and why",
              "Expected life vs. asset age used to forecast approaching end-of-life",
              "Acquisition cost, warranty and lifecycle events kept on one timeline per asset",
              "Assets approaching end-of-life ranked for replacement planning",
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
