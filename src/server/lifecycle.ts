import { prisma } from "@/lib/prisma";
import type { LifecycleEventCreateInput } from "@/lib/validation";
import { createAuditLog } from "@/server/audit";
import { notFound } from "@/server/errors";

export async function listLifecycleEventsForAsset(assetId: string) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId }, select: { id: true } });
  if (!asset) throw notFound("Asset not found");

  return prisma.lifecycleEvent.findMany({
    where: { assetId },
    orderBy: { eventDate: "desc" },
  });
}

export async function createLifecycleEvent(
  assetId: string,
  input: LifecycleEventCreateInput,
  actorUserId: string | null
) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw notFound("Asset not found");

  return prisma.$transaction(async (tx) => {
    const event = await tx.lifecycleEvent.create({
      data: {
        assetId,
        eventType: input.eventType,
        eventDate: input.eventDate,
        description: input.description,
        performedBy: input.performedBy,
        cost: input.cost,
      },
    });

    let stageChanged = false;
    if (input.newLifecycleStage && input.newLifecycleStage !== asset.lifecycleStage) {
      await tx.asset.update({ where: { id: assetId }, data: { lifecycleStage: input.newLifecycleStage } });
      stageChanged = true;
    }

    await createAuditLog(tx, {
      userId: actorUserId,
      assetId,
      action: "LIFECYCLE_EVENT_CREATED",
      fieldChanged: stageChanged ? "lifecycleStage" : undefined,
      oldValue: stageChanged ? asset.lifecycleStage : undefined,
      newValue: stageChanged ? input.newLifecycleStage : input.eventType,
    });

    return event;
  });
}
