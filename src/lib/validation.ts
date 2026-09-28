import { z } from "zod";
import {
  ASSET_STATUSES,
  CRITICALITY_LEVELS,
  LIFECYCLE_STAGES,
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_STATUSES,
  MAINTENANCE_TYPES,
  RELATIONSHIP_TYPES,
} from "@/lib/constants";

const zEnum = <T extends readonly [string, ...string[]]>(values: T) => z.enum(values);

export const assetCreateSchema = z.object({
  assetCode: z.string().trim().min(2, "Asset code is required").max(40),
  name: z.string().trim().min(2, "Name is required").max(200),
  description: z.string().max(2000).optional(),
  departmentId: z.string().min(1, "Department is required"),
  categoryId: z.string().min(1, "Category is required"),
  status: zEnum(ASSET_STATUSES).default("OPERATIONAL"),
  conditionScore: z.number().int().min(0, "Condition must be 0-100").max(100, "Condition must be 0-100").default(100),
  criticality: zEnum(CRITICALITY_LEVELS).default("MEDIUM"),
  lifecycleStage: zEnum(LIFECYCLE_STAGES).default("OPERATIONAL"),
  latitude: z.number().min(-90).max(90, "Invalid latitude"),
  longitude: z.number().min(-180).max(180, "Invalid longitude"),
  address: z.string().max(300).optional(),
  zone: z.string().max(100).optional(),
  installationDate: z.coerce.date().optional(),
  acquisitionDate: z.coerce.date().optional(),
  expectedLifeYears: z.number().int().positive().optional(),
  acquisitionCost: z.number().nonnegative("Cost cannot be negative").optional(),
  warrantyEndDate: z.coerce.date().optional(),
  owner: z.string().max(200).optional(),
  vendorId: z.string().optional(),
  customAttributes: z.record(z.string(), z.unknown()).optional(),
});
export type AssetCreateInput = z.infer<typeof assetCreateSchema>;

export const assetUpdateSchema = assetCreateSchema.partial().omit({ assetCode: true });
export type AssetUpdateInput = z.infer<typeof assetUpdateSchema>;

export const assetListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  sortBy: z.enum(["name", "assetCode", "conditionScore", "riskScore", "createdAt", "updatedAt"]).default("updatedAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  department: z.string().optional(),
  category: z.string().optional(),
  status: zEnum(ASSET_STATUSES).optional(),
  criticality: zEnum(CRITICALITY_LEVELS).optional(),
  lifecycleStage: zEnum(LIFECYCLE_STAGES).optional(),
  zone: z.string().optional(),
  minCondition: z.coerce.number().min(0).max(100).optional(),
  maxCondition: z.coerce.number().min(0).max(100).optional(),
  minRisk: z.coerce.number().min(0).max(100).optional(),
  maxRisk: z.coerce.number().min(0).max(100).optional(),
});
export type AssetListQuery = z.infer<typeof assetListQuerySchema>;

export const inspectionCreateSchema = z.object({
  inspectionDate: z.coerce.date().default(() => new Date()),
  conditionScore: z.number().int().min(0).max(100),
  safetyScore: z.number().int().min(0).max(100).optional(),
  structuralScore: z.number().int().min(0).max(100).optional(),
  operationalScore: z.number().int().min(0).max(100).optional(),
  comments: z.string().max(2000).optional(),
  recommendations: z.string().max(2000).optional(),
});
export type InspectionCreateInput = z.infer<typeof inspectionCreateSchema>;

export const workOrderCreateSchema = z.object({
  assetId: z.string().min(1),
  title: z.string().trim().min(2).max(200),
  description: z.string().max(2000).optional(),
  priority: zEnum(WORK_ORDER_PRIORITIES).default("MEDIUM"),
  assignedTo: z.string().max(200).optional(),
  dueDate: z.coerce.date().optional(),
  estimatedCost: z.number().nonnegative().optional(),
});
export type WorkOrderCreateInput = z.infer<typeof workOrderCreateSchema>;

// One PUT endpoint handles both routine updates (status/priority/assignee)
// and completion — when status is set to COMPLETED, the completion-only
// fields below drive the maintenance-record/lifecycle side effects.
export const workOrderUpdateSchema = z.object({
  status: zEnum(WORK_ORDER_STATUSES).optional(),
  priority: zEnum(WORK_ORDER_PRIORITIES).optional(),
  assignedTo: z.string().max(200).optional(),
  dueDate: z.coerce.date().optional(),
  estimatedCost: z.number().nonnegative().optional(),
  // Completion-only fields (used when status === "COMPLETED"):
  actualCost: z.number().nonnegative().optional(),
  resolution: z.string().max(2000).optional(),
  maintenanceType: zEnum(MAINTENANCE_TYPES).optional(),
  newConditionScore: z.number().int().min(0).max(100).optional(),
});
export type WorkOrderUpdateInput = z.infer<typeof workOrderUpdateSchema>;

export const lifecycleEventCreateSchema = z.object({
  eventType: z.string().trim().min(2).max(100),
  eventDate: z.coerce.date().default(() => new Date()),
  description: z.string().max(2000).optional(),
  performedBy: z.string().max(200).optional(),
  cost: z.number().nonnegative().optional(),
  newLifecycleStage: zEnum(LIFECYCLE_STAGES).optional(),
});
export type LifecycleEventCreateInput = z.infer<typeof lifecycleEventCreateSchema>;

export const relationshipCreateSchema = z.object({
  targetAssetId: z.string().min(1),
  relationshipType: zEnum(RELATIONSHIP_TYPES),
});
export type RelationshipCreateInput = z.infer<typeof relationshipCreateSchema>;

export const notificationUpdateSchema = z.object({
  isRead: z.boolean(),
});
