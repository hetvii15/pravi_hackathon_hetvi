import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/lib/constants";

type TxClient = PrismaClient | Prisma.TransactionClient;

// Notification.userId is required (not every event has an obvious single
// recipient), so we resolve one: prefer the department's manager, fall
// back to any government admin. If neither exists we skip the notification
// rather than violate the FK — better than crashing the triggering mutation.
export async function resolveNotifyUserId(tx: TxClient, departmentId?: string | null): Promise<string | null> {
  if (departmentId) {
    const manager = await tx.user.findFirst({ where: { role: "DEPARTMENT_MANAGER", departmentId } });
    if (manager) return manager.id;
  }
  const admin = await tx.user.findFirst({ where: { role: "GOVERNMENT_ADMIN" } });
  return admin?.id ?? null;
}

export async function createNotification(
  tx: TxClient,
  params: {
    assetId?: string | null;
    departmentId?: string | null;
    title: string;
    message: string;
    type: NotificationType;
  }
) {
  const userId = await resolveNotifyUserId(tx, params.departmentId);
  if (!userId) return null;
  return tx.notification.create({
    data: {
      userId,
      assetId: params.assetId ?? null,
      title: params.title,
      message: params.message,
      type: params.type,
    },
  });
}

export async function listNotifications(params: { unreadOnly?: boolean; page?: number; pageSize?: number }) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 30;

  const where: Prisma.NotificationWhereInput = params.unreadOnly ? { isRead: false } : {};

  const [data, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        asset: { select: { id: true, assetCode: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { isRead: false } }),
  ]);

  return { data, unreadCount, pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } };
}

export async function setNotificationRead(id: string, isRead: boolean) {
  return prisma.notification.update({ where: { id }, data: { isRead } });
}
