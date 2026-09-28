import { Plus, Wrench } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeatureList } from "@/components/feature-list";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function MaintenancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance"
        description="Work orders and maintenance history — preventive, corrective and emergency — across all departments."
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New Work Order
          </Button>
        }
      />

      <Card>
        <CardContent className="py-5">
          <FeatureList
            items={[
              "Work orders tracked from request through assignment to completion",
              "Preventive, corrective and emergency maintenance distinguished",
              "Estimated vs. actual cost tracked per work order",
              "Completed maintenance closes the loop back into asset condition and lifecycle stage",
            ]}
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="work-orders">
        <TabsList>
          <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
          <TabsTrigger value="records">Maintenance Records</TabsTrigger>
        </TabsList>

        <TabsContent value="work-orders">
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody />
              </Table>
            </div>
            <CardContent className="border-t">
              <EmptyState
                icon={Wrench}
                title="No work orders yet"
                description="Open work orders will be listed here, with the highest-priority and overdue items surfaced first."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records">
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody />
              </Table>
            </div>
            <CardContent className="border-t">
              <EmptyState
                icon={Wrench}
                title="No maintenance records yet"
                description="Completed maintenance work will be logged here for full lifecycle traceability."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
