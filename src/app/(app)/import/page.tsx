import { Upload, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeatureList } from "@/components/feature-list";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Import" description="Bulk-load asset records from spreadsheets or existing department registers." />

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Upload className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium">Drag and drop a CSV, or click to browse</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Import is not yet connected to the database layer. Once wired in, uploaded rows will be validated and inserted as assets.
          </p>
          <Button variant="outline" size="sm" disabled>
            <FileSpreadsheet className="h-4 w-4" />
            Choose File
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-5">
          <FeatureList
            items={[
              "CSV columns mapped to asset fields, with category-specific attributes supported",
              "Rows validated before insert — invalid rows reported, not silently dropped",
              "Existing asset codes updated rather than duplicated",
              "Import history kept for auditability",
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
