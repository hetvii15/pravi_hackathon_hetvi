import { prisma } from "@/lib/prisma";
import type { AssetStatus, Criticality } from "@/lib/constants";

export type RiskResult = {
  riskScore: number; // 0-100
  riskLevel: Criticality; // reuse the LOW/MEDIUM/HIGH/CRITICAL scale
  reasons: string[];
};

const CRITICALITY_SCORE: Record<Criticality, number> = {
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75,
  CRITICAL: 100,
};

type RiskInput = {
  conditionScore: number;
  criticality: Criticality;
  status: AssetStatus;
  nextInspectionDate: Date | null;
  correctiveOrEmergencyCount: number;
};

// Deterministic, explainable risk scoring — no ML/AI. Every point on the
// score traces back to a concrete, inspectable reason so it can be shown
// directly to a government reviewer, not treated as a black box.
//
//   riskScore = conditionRisk * 0.5 + criticalityScore * 0.3 + failureHistoryScore * 0.2
export function calculateAssetRisk(input: RiskInput): RiskResult {
  const conditionRisk = 100 - input.conditionScore;
  const criticalityScore = CRITICALITY_SCORE[input.criticality];

  let failureHistoryScore = 0;
  if (input.status === "FAILED") failureHistoryScore += 60;
  else if (input.status === "DAMAGED") failureHistoryScore += 35;
  failureHistoryScore += Math.min(60, input.correctiveOrEmergencyCount * 15);

  let overdueDays = 0;
  if (input.nextInspectionDate) {
    overdueDays = Math.floor((Date.now() - input.nextInspectionDate.getTime()) / (1000 * 60 * 60 * 24));
    if (overdueDays > 0) failureHistoryScore += Math.min(20, Math.ceil(overdueDays / 30) * 5);
  }
  failureHistoryScore = Math.max(0, Math.min(100, failureHistoryScore));

  const raw = conditionRisk * 0.5 + criticalityScore * 0.3 + failureHistoryScore * 0.2;
  const riskScore = Math.max(0, Math.min(100, Math.round(raw)));

  const riskLevel: Criticality =
    riskScore >= 75 ? "CRITICAL" : riskScore >= 50 ? "HIGH" : riskScore >= 25 ? "MEDIUM" : "LOW";

  const reasons: string[] = [];
  if (input.conditionScore <= 40) reasons.push(`Poor condition score (${input.conditionScore}/100)`);
  else if (input.conditionScore <= 60) reasons.push(`Fair condition score (${input.conditionScore}/100)`);
  if (input.criticality === "HIGH" || input.criticality === "CRITICAL") {
    reasons.push(`${input.criticality === "CRITICAL" ? "Critical" : "High"}-criticality infrastructure`);
  }
  if (input.status === "FAILED") reasons.push("Asset is currently marked Failed");
  if (input.status === "DAMAGED") reasons.push("Asset is currently marked Damaged");
  if (input.correctiveOrEmergencyCount > 0) {
    reasons.push(
      `${input.correctiveOrEmergencyCount} previous corrective/emergency maintenance record${
        input.correctiveOrEmergencyCount === 1 ? "" : "s"
      }`
    );
  }
  if (overdueDays > 0) reasons.push(`Next inspection overdue by ${overdueDays} day${overdueDays === 1 ? "" : "s"}`);
  if (reasons.length === 0) reasons.push("No material risk factors detected");

  return { riskScore, riskLevel, reasons };
}

// Loads the inputs calculateAssetRisk() needs for a given asset. Kept
// separate from the pure function above so the scoring logic itself stays
// trivially unit-testable without a database.
export async function computeAssetRisk(assetId: string): Promise<RiskResult> {
  const asset = await prisma.asset.findUniqueOrThrow({
    where: { id: assetId },
    select: { conditionScore: true, criticality: true, status: true, nextInspectionDate: true },
  });

  const correctiveOrEmergencyCount = await prisma.maintenanceRecord.count({
    where: { assetId, maintenanceType: { in: ["CORRECTIVE", "EMERGENCY"] } },
  });

  return calculateAssetRisk({ ...asset, correctiveOrEmergencyCount });
}

// Recomputes and persists riskScore on the asset row. Callers should invoke
// this inside the same transaction as whatever change (inspection, work
// order completion, status/condition update) triggered the recalculation.
export async function recalculateAndPersistRisk(
  tx: typeof prisma,
  assetId: string
): Promise<RiskResult> {
  const asset = await tx.asset.findUniqueOrThrow({
    where: { id: assetId },
    select: { conditionScore: true, criticality: true, status: true, nextInspectionDate: true },
  });
  const correctiveOrEmergencyCount = await tx.maintenanceRecord.count({
    where: { assetId, maintenanceType: { in: ["CORRECTIVE", "EMERGENCY"] } },
  });
  const result = calculateAssetRisk({ ...asset, correctiveOrEmergencyCount });
  await tx.asset.update({ where: { id: assetId }, data: { riskScore: result.riskScore } });
  return result;
}
