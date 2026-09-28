import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleSettings } from "@/components/layout/role-settings";
import { FeatureList } from "@/components/feature-list";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Demo access, platform configuration and about this build." />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Demo Role</CardTitle>
        </CardHeader>
        <CardContent>
          <RoleSettings />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">About Infra360</CardTitle>
        </CardHeader>
        <CardContent>
          <FeatureList
            items={[
              "Generalized cross-department infrastructure asset lifecycle platform",
              "One data model for every asset type — department- and category-specific fields live alongside common ones",
              "Built as a single Next.js application: UI, API/server actions and business logic in one codebase over PostgreSQL via Prisma",
              "No QR functionality — out of scope for this build by design",
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
