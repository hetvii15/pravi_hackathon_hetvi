import { Plus, Search, Boxes } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DEPARTMENTS = ["Road & Building", "Water", "Drainage", "Street Lighting", "Traffic"];

export default function AssetsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Assets"
        description="The complete cross-department asset inventory — searchable and filterable by department, category, status and criticality."
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add Asset
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by asset code or name…" className="pl-8" disabled />
          </div>
          <Select disabled>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select disabled>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="operational">Operational</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select disabled>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All criticality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Criticality</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Zone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody />
          </Table>
        </div>
        <CardContent className="border-t">
          <EmptyState
            icon={Boxes}
            title="No assets loaded yet"
            description="Once the database layer is connected, every asset across all five departments will be listed here with live filtering and sorting."
          />
        </CardContent>
      </Card>
    </div>
  );
}
