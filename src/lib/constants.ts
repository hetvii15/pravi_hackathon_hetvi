// Shared UI vocabulary for Infra360.
// Mirrors the enum names/values used in the Prisma schema owned by the
// database-layer workstream (see prisma/schema.prisma) so wiring real
// queries into these pages later is a data-fetch change, not a rewrite.

export const ROLES = [
  "GOVERNMENT_ADMIN",
  "DEPARTMENT_MANAGER",
  "INSPECTOR",
  "MAINTENANCE_OFFICER",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_META: Record<Role, { label: string }> = {
  GOVERNMENT_ADMIN: { label: "Government Admin" },
  DEPARTMENT_MANAGER: { label: "Department Manager" },
  INSPECTOR: { label: "Inspector" },
  MAINTENANCE_OFFICER: { label: "Maintenance Officer" },
};

export const ASSET_STATUSES = [
  "PLANNED",
  "PROCURED",
  "UNDER_CONSTRUCTION",
  "OPERATIONAL",
  "MAINTENANCE",
  "DAMAGED",
  "FAILED",
  "RETIRED",
  "DISPOSED",
] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const STATUS_META: Record<AssetStatus, { label: string; className: string }> = {
  PLANNED: { label: "Planned", className: "bg-blue-50 text-blue-700 border-blue-200" },
  PROCURED: { label: "Procured", className: "bg-blue-50 text-blue-700 border-blue-200" },
  UNDER_CONSTRUCTION: { label: "Under Construction", className: "bg-amber-50 text-amber-700 border-amber-200" },
  OPERATIONAL: { label: "Operational", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  MAINTENANCE: { label: "Maintenance", className: "bg-amber-50 text-amber-700 border-amber-200" },
  DAMAGED: { label: "Damaged", className: "bg-orange-50 text-orange-700 border-orange-200" },
  FAILED: { label: "Failed", className: "bg-red-50 text-red-700 border-red-200" },
  RETIRED: { label: "Retired", className: "bg-neutral-100 text-neutral-600 border-neutral-200" },
  DISPOSED: { label: "Disposed", className: "bg-neutral-100 text-neutral-600 border-neutral-200" },
};

export const CRITICALITY_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type Criticality = (typeof CRITICALITY_LEVELS)[number];

export const CRITICALITY_META: Record<Criticality, { label: string; className: string }> = {
  LOW: { label: "Low", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  MEDIUM: { label: "Medium", className: "bg-amber-50 text-amber-700 border-amber-200" },
  HIGH: { label: "High", className: "bg-orange-50 text-orange-700 border-orange-200" },
  CRITICAL: { label: "Critical", className: "bg-red-50 text-red-700 border-red-200" },
};

export const LIFECYCLE_STAGES = [
  "PLANNED",
  "PROCURED",
  "CONSTRUCTED",
  "INSTALLED",
  "COMMISSIONED",
  "OPERATIONAL",
  "INSPECTION",
  "MAINTENANCE",
  "REPAIR",
  "UPGRADE",
  "REPLACEMENT_PLANNED",
  "RETIRED",
  "DISPOSED",
] as const;
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const LIFECYCLE_META: Record<LifecycleStage, { label: string; className: string }> = {
  PLANNED: { label: "Planned", className: "bg-blue-50 text-blue-700 border-blue-200" },
  PROCURED: { label: "Procured", className: "bg-blue-50 text-blue-700 border-blue-200" },
  CONSTRUCTED: { label: "Constructed", className: "bg-sky-50 text-sky-700 border-sky-200" },
  INSTALLED: { label: "Installed", className: "bg-sky-50 text-sky-700 border-sky-200" },
  COMMISSIONED: { label: "Commissioned", className: "bg-sky-50 text-sky-700 border-sky-200" },
  OPERATIONAL: { label: "Operational", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  INSPECTION: { label: "Inspection", className: "bg-amber-50 text-amber-700 border-amber-200" },
  MAINTENANCE: { label: "Maintenance", className: "bg-amber-50 text-amber-700 border-amber-200" },
  REPAIR: { label: "Repair", className: "bg-orange-50 text-orange-700 border-orange-200" },
  UPGRADE: { label: "Upgrade", className: "bg-orange-50 text-orange-700 border-orange-200" },
  REPLACEMENT_PLANNED: { label: "Replacement Planned", className: "bg-orange-50 text-orange-700 border-orange-200" },
  RETIRED: { label: "Retired", className: "bg-neutral-100 text-neutral-600 border-neutral-200" },
  DISPOSED: { label: "Disposed", className: "bg-neutral-100 text-neutral-600 border-neutral-200" },
};

export const WORK_ORDER_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type WorkOrderPriority = (typeof WORK_ORDER_PRIORITIES)[number];
export const WORK_ORDER_PRIORITY_META = CRITICALITY_META as Record<
  WorkOrderPriority,
  { label: string; className: string }
>;

export const WORK_ORDER_STATUSES = [
  "REQUESTED",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;
export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export const WORK_ORDER_STATUS_META: Record<WorkOrderStatus, { label: string; className: string }> = {
  REQUESTED: { label: "Requested", className: "bg-blue-50 text-blue-700 border-blue-200" },
  ASSIGNED: { label: "Assigned", className: "bg-sky-50 text-sky-700 border-sky-200" },
  IN_PROGRESS: { label: "In Progress", className: "bg-amber-50 text-amber-700 border-amber-200" },
  COMPLETED: { label: "Completed", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELLED: { label: "Cancelled", className: "bg-neutral-100 text-neutral-600 border-neutral-200" },
};

export const MAINTENANCE_TYPES = [
  "PREVENTIVE",
  "CORRECTIVE",
  "EMERGENCY",
  "INSPECTION_RELATED",
] as const;
export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number];

export const RELATIONSHIP_TYPES = [
  "CONTAINS",
  "CONNECTED_TO",
  "DEPENDS_ON",
  "LOCATED_ON",
  "SERVES",
  "RELATED_TO",
] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const NOTIFICATION_TYPES = [
  "INFO",
  "WARNING",
  "CRITICAL",
  "INSPECTION_DUE",
  "MAINTENANCE_DUE",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_TYPE_META: Record<NotificationType, { label: string; className: string }> = {
  INFO: { label: "Info", className: "bg-blue-50 text-blue-700 border-blue-200" },
  WARNING: { label: "Warning", className: "bg-amber-50 text-amber-700 border-amber-200" },
  CRITICAL: { label: "Critical", className: "bg-red-50 text-red-700 border-red-200" },
  INSPECTION_DUE: { label: "Inspection Due", className: "bg-orange-50 text-orange-700 border-orange-200" },
  MAINTENANCE_DUE: { label: "Maintenance Due", className: "bg-orange-50 text-orange-700 border-orange-200" },
};

// Condition score (0-100) -> semantic color band (prototype thresholds).
export function conditionBand(score: number): { label: string; className: string } {
  if (score >= 81) return { label: "Excellent", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (score >= 61) return { label: "Good", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (score >= 41) return { label: "Fair", className: "bg-amber-50 text-amber-700 border-amber-200" };
  if (score >= 21) return { label: "Poor", className: "bg-orange-50 text-orange-700 border-orange-200" };
  return { label: "Critical", className: "bg-red-50 text-red-700 border-red-200" };
}

export function riskBand(score: number): { label: string; className: string } {
  if (score >= 75) return { label: "Critical Risk", className: "bg-red-50 text-red-700 border-red-200" };
  if (score >= 50) return { label: "High Risk", className: "bg-orange-50 text-orange-700 border-orange-200" };
  if (score >= 25) return { label: "Medium Risk", className: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: "Low Risk", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
}
