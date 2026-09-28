import type { AssetStatus, Criticality } from "@/lib/constants";

export type AssetRecommendationInput = {
  conditionScore: number;
  criticality: Criticality;
  status: AssetStatus;
  nextInspectionDate: Date | null;
  correctiveOrEmergencyCount: number;
};

// Deterministic, rule-based recommendation text — mirrors the same
// "explainable, not a black box" philosophy as calculateAssetRisk() in
// src/server/risk.ts. Rules are evaluated top-to-bottom, most severe
// first; the first match wins.
export function getRecommendedAction(input: AssetRecommendationInput): string {
  const overdue = input.nextInspectionDate ? input.nextInspectionDate.getTime() < Date.now() : true;

  if (input.conditionScore < 30) {
    return "Immediate inspection and corrective maintenance recommended.";
  }
  if (input.criticality === "CRITICAL" && input.conditionScore < 50) {
    return "High-priority intervention recommended.";
  }
  if (input.correctiveOrEmergencyCount >= 2) {
    return "Review repair versus replacement.";
  }
  if (overdue) {
    return "Inspection should be scheduled.";
  }
  if (input.status === "DAMAGED" || input.status === "FAILED") {
    return "Asset is non-operational — prioritize a work order.";
  }
  return "No immediate action required — continue routine monitoring.";
}
