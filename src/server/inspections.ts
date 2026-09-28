import { prisma } from "@/lib/prisma";
import type { InspectionCreateInput } from "@/lib/validation";
import type { Criticality } from "@/lib/constants";
import { recalculateAndPersistRisk } from "@/server/risk";
import { createAuditLog } from "@/server/audit";
import { createNotification } from "@/server/notifications";
import { notFound } from "@/server/errors";

// Inspection cadence policy: more critical infrastructure is inspected more
// often. Deliberately simple and stated up front rather than tuned per asset.
const INSPECTION_INTERVAL_MONTHS: Record<Criticality, number> = {
  CRITICAL: 3,
  HIGH: 6,
  MEDIUM: 12,
  LOW: 18,
};

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export async function listInspectionsForAsset(assetId: string) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId }, select: { id: true } });
  if (!asset) throw notFound("Asset not found");

  return prisma.inspection.findMany({
    where: { assetId },
    orderBy: { inspectionDate: "desc" },
    include: { inspector: { select: { id: true, name: true } } },
  });
}

export async function createInspection(
  assetId: string,
  input: InspectionCreateInput,
  actorUserId: string | null
) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw notFound("Asset not found");

  const nextInspectionDate = addMonths(input.inspectionDate, INSPECTION_INTERVAL_MONTHS[asset.criticality]);

  return prisma.$transaction(async (tx) => {
    const inspection = await tx.inspection.create({
      data: {
        assetId,
        inspectorId: actorUserId,
        inspectionDate: input.inspectionDate,
        conditionScore: input.conditionScore,
        safetyScore: input.safetyScore,
        structuralScore: input.structuralScore,
        operationalScore: input.operationalScore,
        comments: input.comments,
        recommendations: input.recommendations,
      },
    });

    const previousCondition = asset.conditionScore;

    await tx.asset.update({
      where: { id: assetId },
      data: {
        conditionScore: input.conditionScore,
        lastInspectionDate: input.inspectionDate,
        nextInspectionDate,
      },
    });

    const risk = await recalculateAndPersistRisk(tx as typeof prisma, assetId);

    await tx.lifecycleEvent.create({
      data: {
        assetId,
        eventType: "INSPECTION_COMPLETED",
        eventDate: input.inspectionDate,
        description: `Condition ${previousCondition} -> ${input.conditionScore}. ${input.recommendations ?? ""}`.trim(),
        performedBy: actorUserId ?? undefined,
      },
    });

    await createAuditLog(tx, {
      userId: actorUserId,
      assetId,
      action: "INSPECTION_CREATED",
      fieldChanged: "conditionScore",
      oldValue: String(previousCondition),
      newValue: String(input.conditionScore),
    });

    if (input.conditionScore <= 40) {
      await createNotification(tx, {
        assetId,
        departmentId: asset.departmentId,
        type: input.conditionScore <= 20 ? "CRITICAL" : "WARNING",
        title: `${asset.name} inspected in ${input.conditionScore <= 20 ? "critical" : "poor"} condition`,
        message: `Inspection on ${input.inspectionDate.toDateString()} recorded a condition score of ${input.conditionScore}/100 (risk score now ${risk.riskScore}).`,
      });
    }

    return { inspection, nextInspectionDate, risk };
  });
}
