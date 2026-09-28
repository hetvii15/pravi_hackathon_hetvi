import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { WorkOrderCreateInput, WorkOrderUpdateInput } from "@/lib/validation";
import type { WorkOrderPriority, WorkOrderStatus, NotificationType } from "@/lib/constants";
import { notFound } from "@/server/errors";
import { createAuditLog } from "@/server/audit";
import { createNotification } from "@/server/notifications";
import { recalculateAndPersistRisk } from "@/server/risk";

// New-work-order notifications are prioritized the same way the rest of the
// app signals urgency: CRITICAL priority -> CRITICAL notification, HIGH ->
// WARNING, everything else -> INFO.
const PRIORITY_NOTIFICATION_TYPE: Record<WorkOrderPriority, NotificationType> = {
  CRITICAL: "CRITICAL",
  HIGH: "WARNING",
  MEDIUM: "INFO",
  LOW: "INFO",
};

export type WorkOrderListQuery = {
  status?: string;
  priority?: string;
  department?: string;
  category?: string;
  assetId?: string;
  assignedTo?: string;
  page?: number;
  pageSize?: number;
};

export async function listWorkOrders(query: WorkOrderListQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const pageSize = query.pageSize && query.pageSize > 0 ? Math.min(query.pageSize, 100) : 20;

  const where: Prisma.WorkOrderWhereInput = {};

  if (query.status) where.status = query.status as WorkOrderStatus;
  if (query.priority) where.priority = query.priority as WorkOrderPriority;
  if (query.assetId) where.assetId = query.assetId;
  if (query.assignedTo) where.assignedTo = { contains: query.assignedTo, mode: "insensitive" };

  if (query.department || query.category) {
    where.asset = {
      ...(query.department
        ? {
            department: {
              OR: [{ id: query.department }, { code: { equals: query.department, mode: "insensitive" } }],
            },
          }
        : {}),
      ...(query.category
        ? {
            category: {
              OR: [{ id: query.category }, { code: { equals: query.category, mode: "insensitive" } }],
            },
          }
        : {}),
    };
  }

  const [data, total] = await Promise.all([
    prisma.workOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        asset: { select: { id: true, assetCode: true, name: true, departmentId: true, status: true } },
      },
    }),
    prisma.workOrder.count({ where }),
  ]);

  return {
    data,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}

export async function createWorkOrder(input: WorkOrderCreateInput, actorUserId: string | null) {
  const asset = await prisma.asset.findUnique({ where: { id: input.assetId } });
  if (!asset) throw notFound("Asset not found");

  return prisma.$transaction(async (tx) => {
    const workOrder = await tx.workOrder.create({
      data: {
        assetId: input.assetId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        assignedTo: input.assignedTo,
        dueDate: input.dueDate,
        estimatedCost: input.estimatedCost,
        createdBy: actorUserId,
      },
    });

    await createAuditLog(tx, {
      userId: actorUserId,
      assetId: input.assetId,
      action: "WORK_ORDER_CREATED",
      newValue: workOrder.title,
    });

    await createNotification(tx, {
      assetId: input.assetId,
      departmentId: asset.departmentId,
      title: `New work order: ${workOrder.title}`,
      message: `A ${input.priority.toLowerCase()} priority work order was created for ${asset.name} (${asset.assetCode}).`,
      type: PRIORITY_NOTIFICATION_TYPE[input.priority],
    });

    return workOrder;
  });
}

export async function updateWorkOrder(id: string, input: WorkOrderUpdateInput, actorUserId: string | null) {
  const existing = await prisma.workOrder.findUnique({ where: { id }, include: { asset: true } });
  if (!existing) throw notFound("Work order not found");

  return prisma.$transaction(async (tx) => {
    const data: Prisma.WorkOrderUpdateInput = {};
    if (input.status !== undefined) data.status = input.status;
    if (input.priority !== undefined) data.priority = input.priority;
    if (input.assignedTo !== undefined) data.assignedTo = input.assignedTo;
    if (input.dueDate !== undefined) data.dueDate = input.dueDate;
    if (input.estimatedCost !== undefined) data.estimatedCost = input.estimatedCost;

    const isCompleting = input.status === "COMPLETED" && existing.status !== "COMPLETED";

    if (isCompleting) {
      const actualCost = input.actualCost ?? existing.estimatedCost ?? undefined;

      data.completedAt = new Date();
      data.actualCost = actualCost;
      data.resolution = input.resolution;

      await tx.maintenanceRecord.create({
        data: {
          assetId: existing.assetId,
          workOrderId: id,
          maintenanceType: input.maintenanceType ?? "CORRECTIVE",
          performedDate: new Date(),
          description: input.resolution,
          cost: actualCost ?? null,
          performedBy: input.assignedTo ?? existing.assignedTo ?? undefined,
          result: "COMPLETED",
        },
      });

      await tx.lifecycleEvent.create({
        data: {
          assetId: existing.assetId,
          eventType: "MAINTENANCE_COMPLETED",
          eventDate: new Date(),
          description: input.resolution ?? "Work order completed",
          cost: input.actualCost ?? undefined,
          performedBy: actorUserId ?? undefined,
        },
      });

      if (input.newConditionScore !== undefined) {
        const assetUpdateData: Prisma.AssetUpdateInput = { conditionScore: input.newConditionScore };
        if (existing.asset.status === "DAMAGED" || existing.asset.status === "FAILED") {
          assetUpdateData.status = "OPERATIONAL";
        }
        await tx.asset.update({ where: { id: existing.assetId }, data: assetUpdateData });
      }

      // Condition and/or status may have just changed — keep riskScore in sync.
      await recalculateAndPersistRisk(tx as typeof prisma, existing.assetId);
    }

    const workOrder = await tx.workOrder.update({ where: { id }, data });

    await createAuditLog(tx, {
      userId: actorUserId,
      assetId: existing.assetId,
      action: isCompleting ? "WORK_ORDER_COMPLETED" : "WORK_ORDER_UPDATED",
      fieldChanged: "status",
      oldValue: existing.status,
      newValue: input.status ?? existing.status,
    });

    return workOrder;
  });
}
