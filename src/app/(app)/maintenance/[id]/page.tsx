import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Wrench } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORK_ORDER_PRIORITY_META, WORK_ORDER_STATUS_META } from "@/lib/constants";
import { WorkOrderStatusSelect } from "@/components/maintenance/work-order-status-select";
import { CompleteWorkOrderDialog } from "@/components/maintenance/complete-work-order-dialog";

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return format(new Date(date), "MMM d, yyyy");
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `₹${value.toLocaleString("en-IN")}`;
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default async function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      asset: {
        select: {
          id: true,
          assetCode: true,
          name: true,
          status: true,
          department: { select: { name: true } },
        },
      },
      maintenanceRecords: { orderBy: { performedDate: "desc" } },
    },
  });

  if (!workOrder) {
    notFound();
  }

  const canComplete = workOrder.status !== "COMPLETED" && workOrder.status !== "CANCELLED";

  return (
    <div className="space-y-6">
      <PageHeader
        title={workOrder.title}
        description={`${workOrder.asset.assetCode} — ${workOrder.asset.name}, ${workOrder.asset.department.name}`}
        actions={
          <>
            <WorkOrderStatusSelect workOrderId={workOrder.id} currentStatus={workOrder.status} />
            {canComplete && (
              <CompleteWorkOrderDialog
                workOrder={{ id: workOrder.id, title: workOrder.title, assetId: workOrder.assetId }}
              />
            )}
          </>
        }
      />

      <Card>
        <CardContent className="py-4">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Asset"
              value={
                <Link href={`/assets/${workOrder.asset.id}`} className="text-primary hover:underline">
                  {workOrder.asset.assetCode} — {workOrder.asset.name}
                </Link>
              }
            />
            <Field label="Problem / Description" value={workOrder.description ?? "—"} />
            <Field
              label="Priority"
              value={
                <Badge
                  variant="outline"
                  className={WORK_ORDER_PRIORITY_META[workOrder.priority].className}
                >
                  {WORK_ORDER_PRIORITY_META[workOrder.priority].label}
                </Badge>
              }
            />
            <Field
              label="Status"
              value={
                <Badge
                  variant="outline"
                  className={WORK_ORDER_STATUS_META[workOrder.status].className}
                >
                  {WORK_ORDER_STATUS_META[workOrder.status].label}
                </Badge>
              }
            />
            <Field label="Assigned To" value={workOrder.assignedTo ?? "—"} />
            <Field label="Created Date" value={formatDate(workOrder.createdAt)} />
            <Field label="Due Date" value={formatDate(workOrder.dueDate)} />
            <Field label="Estimated Cost" value={formatCurrency(workOrder.estimatedCost)} />
            <Field label="Actual Cost" value={formatCurrency(workOrder.actualCost)} />
            <Field label="Resolution" value={workOrder.resolution ?? "—"} />
          </dl>
        </CardContent>
      </Card>

      {workOrder.maintenanceRecords.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No maintenance records yet"
          description="Completed maintenance tied to this work order will be logged here for full traceability."
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Performed Date</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workOrder.maintenanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Badge variant="outline">{record.maintenanceType.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(record.performedDate)}</TableCell>
                    <TableCell>{formatCurrency(record.cost)}</TableCell>
                    <TableCell>{record.result ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
