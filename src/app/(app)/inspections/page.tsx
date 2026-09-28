import { Plus, ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FeatureList } from "@/components/feature-list";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function InspectionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inspections"
        description="Inspection history and schedule across every asset, with overdue inspections surfaced automatically."
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Log Inspection
          </Button>
        }
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
            <TableBody />
          </Table>
        </div>
        <CardContent className="border-t">
          <EmptyState
            icon={ClipboardCheck}
            title="No inspections recorded yet"
            description="Logged inspections will appear here, ordered by most recent, with overdue assets highlighted at the top."
          />
        </CardContent>
      </Card>
    </div>
  );
}
