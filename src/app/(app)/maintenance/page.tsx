import Link from "next/link";
import { Wrench, ClipboardList, AlertTriangle, Clock, CheckCircle2, PiggyBank } from "lucide-react";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeatureList } from "@/components/feature-list";
import { KpiCard } from "@/components/kpi-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORK_ORDER_PRIORITY_META, WORK_ORDER_STATUS_META } from "@/lib/constants";
import { NewWorkOrderDialog } from "@/components/maintenance/new-work-order-dialog";
import { CompleteWorkOrderDialog } from "@/components/maintenance/complete-work-order-dialog";

export const dynamic = "force-dynamic";

const OPEN_STATUSES = ["REQUESTED", "ASSIGNED", "IN_PROGRESS"] as const;
const CLOSED_STATUSES = ["COMPLETED", "CANCELLED"] as const;

export default async function MaintenancePage() {
  const [
    workOrders,
    maintenanceRecords,
    assets,
    openWorkOrderCount,
    criticalWorkOrderCount,
    overdueWorkOrderCount,
    completedWorkOrderCount,
    workOrderCostAgg,
    maintenanceRecordCostAgg,
  ] = await Promise.all([
    prisma.workOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { asset: { select: { id: true, assetCode: true, name: true } } },
    }),
    prisma.maintenanceRecord.findMany({
      orderBy: { performedDate: "desc" },
      take: 100,
      include: { asset: { select: { id: true, assetCode: true, name: true } } },
    }),
    prisma.asset.findMany({
      select: { id: true, assetCode: true, name: true },
      orderBy: { name: "asc" },
      take: 300,
    }),
    prisma.workOrder.count({ where: { status: { in: [...OPEN_STATUSES] } } }),
    prisma.workOrder.count({
      where: { priority: "CRITICAL", status: { notIn: [...CLOSED_STATUSES] } },
    }),
    prisma.workOrder.count({
      where: { dueDate: { lt: new Date() }, status: { notIn: [...CLOSED_STATUSES] } },
    }),
    prisma.workOrder.count({ where: { status: "COMPLETED" } }),
    prisma.workOrder.aggregate({ _sum: { actualCost: true } }),
    prisma.maintenanceRecord.aggregate({ _sum: { cost: true } }),
  ]);

  const maintenanceSpend =
    (workOrderCostAgg._sum.actualCost ?? 0) + (maintenanceRecordCostAgg._sum.cost ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance"
        description="Work orders and maintenance history — preventive, corrective and emergency — across all departments."
        actions={<NewWorkOrderDialog assets={assets} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Open Work Orders"
          value={openWorkOrderCount.toLocaleString("en-IN")}
          icon={ClipboardList}
          hint="Requested, assigned or in progress"
          accent="info"
        />
        <KpiCard
          label="Critical Work Orders"
          value={criticalWorkOrderCount.toLocaleString("en-IN")}
          icon={AlertTriangle}
          hint="Critical priority, not yet closed"
          accent="bad"
        />
        <KpiCard
          label="Overdue"
          value={overdueWorkOrderCount.toLocaleString("en-IN")}
          icon={Clock}
          hint="Past due date, not yet closed"
          accent="warn"
        />
        <KpiCard
          label="Completed"
          value={completedWorkOrderCount.toLocaleString("en-IN")}
          icon={CheckCircle2}
          hint="All-time completed work orders"
          accent="good"
        />
        <KpiCard
          label="Maintenance Spend"
          value={`₹${maintenanceSpend.toLocaleString("en-IN")}`}
          icon={PiggyBank}
          hint="Actual work order + maintenance record cost"
          accent="neutral"
        />
      </div>

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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workOrders.map((wo) => (
                    <TableRow key={wo.id}>
                      <TableCell>
                        <span className="font-medium">{wo.asset.assetCode}</span>
                        <span className="text-muted-foreground"> — {wo.asset.name}</span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/maintenance/${wo.id}`} className="text-primary hover:underline">
                          {wo.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={WORK_ORDER_PRIORITY_META[wo.priority].className}
                        >
                          {WORK_ORDER_PRIORITY_META[wo.priority].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={WORK_ORDER_STATUS_META[wo.status].className}
                        >
                          {WORK_ORDER_STATUS_META[wo.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>{wo.assignedTo ?? "—"}</TableCell>
                      <TableCell>{wo.dueDate ? format(wo.dueDate, "MMM d, yyyy") : "—"}</TableCell>
                      <TableCell className="text-right">
                        {wo.status !== "COMPLETED" && wo.status !== "CANCELLED" && (
                          <CompleteWorkOrderDialog
                            workOrder={{ id: wo.id, title: wo.title, assetId: wo.assetId }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {workOrders.length === 0 && (
              <CardContent className="border-t">
                <EmptyState
                  icon={Wrench}
                  title="No work orders yet"
                  description="Open work orders will be listed here, with the highest-priority and overdue items surfaced first."
                />
              </CardContent>
            )}
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
                <TableBody>
                  {maintenanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <span className="font-medium">{record.asset.assetCode}</span>
                        <span className="text-muted-foreground"> — {record.asset.name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.maintenanceType.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell>{record.performedBy ?? "—"}</TableCell>
                      <TableCell>{format(record.performedDate, "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        {record.cost != null ? `₹${record.cost.toLocaleString("en-IN")}` : "—"}
                      </TableCell>
                      <TableCell>{record.result ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {maintenanceRecords.length === 0 && (
              <CardContent className="border-t">
                <EmptyState
                  icon={Wrench}
                  title="No maintenance records yet"
                  description="Completed maintenance work will be logged here for full lifecycle traceability."
                />
              </CardContent>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
