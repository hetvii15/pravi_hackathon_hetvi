import { prisma } from "@/lib/prisma";

// Fixed condition/risk bands used across the dashboard and departments
// server modules. Duplicated in src/server/departments.ts intentionally —
// small enough that sharing isn't worth the coupling given the timeline.
const CONDITION_BANDS = [
  { band: "Excellent", gte: 81, lte: 100 },
  { band: "Good", gte: 61, lte: 80 },
  { band: "Fair", gte: 41, lte: 60 },
  { band: "Poor", gte: 21, lte: 40 },
  { band: "Critical", gte: 0, lte: 20 },
] as const;

const RISK_BANDS = [
  { band: "Low", gte: 0, lte: 24 },
  { band: "Medium", gte: 25, lte: 49 },
  { band: "High", gte: 50, lte: 74 },
  { band: "Critical", gte: 75, lte: 100 },
] as const;

export async function getDashboardMetrics() {
  const now = new Date();

  const [
    totalAssets,
    operationalAssets,
    maintenanceDue,
    overdueInspections,
    highRiskAssets,
    criticalAssets,
    retiredAssets,
    assetsUnderMaintenance,
    avgConditionAgg,
    assetsByDepartmentRaw,
    assetsByCategoryRaw,
    departments,
    categories,
    conditionCounts,
    riskCounts,
    lifecycleDistributionRaw,
    maintenanceStatusRaw,
    topRiskAssets,
    upcomingMaintenance,
    overdueInspectionsList,
    recentlyUpdatedAssets,
  ] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.count({ where: { status: "OPERATIONAL" } }),
    prisma.asset.count({
      where: {
        OR: [{ status: "MAINTENANCE" }, { lifecycleStage: { in: ["MAINTENANCE", "REPAIR"] } }],
      },
    }),
    prisma.asset.count({ where: { nextInspectionDate: { lt: now } } }),
    prisma.asset.count({ where: { riskScore: { gte: 50 } } }),
    prisma.asset.count({ where: { riskScore: { gte: 75 } } }),
    prisma.asset.count({ where: { status: { in: ["RETIRED", "DISPOSED"] } } }),
    prisma.asset.count({ where: { status: "MAINTENANCE" } }),
    prisma.asset.aggregate({ _avg: { conditionScore: true } }),
    prisma.asset.groupBy({ by: ["departmentId"], _count: true }),
    prisma.asset.groupBy({ by: ["categoryId"], _count: true }),
    prisma.department.findMany({ select: { id: true, name: true } }),
    prisma.assetCategory.findMany({ select: { id: true, name: true } }),
    Promise.all(
      CONDITION_BANDS.map((b) => prisma.asset.count({ where: { conditionScore: { gte: b.gte, lte: b.lte } } }))
    ),
    Promise.all(
      RISK_BANDS.map((b) => prisma.asset.count({ where: { riskScore: { gte: b.gte, lte: b.lte } } }))
    ),
    prisma.asset.groupBy({ by: ["lifecycleStage"], _count: true }),
    prisma.workOrder.groupBy({ by: ["status"], _count: true }),
    prisma.asset.findMany({
      orderBy: { riskScore: "desc" },
      take: 8,
      select: {
        id: true,
        assetCode: true,
        name: true,
        riskScore: true,
        criticality: true,
        conditionScore: true,
        status: true,
        department: { select: { name: true } },
      },
    }),
    prisma.workOrder.findMany({
      where: { status: { in: ["REQUESTED", "ASSIGNED", "IN_PROGRESS"] }, dueDate: { not: null } },
      orderBy: { dueDate: "asc" },
      take: 8,
      include: { asset: { select: { assetCode: true, name: true } } },
    }),
    prisma.asset.findMany({
      where: { nextInspectionDate: { lt: now } },
      orderBy: { nextInspectionDate: "asc" },
      take: 8,
      select: {
        id: true,
        assetCode: true,
        name: true,
        nextInspectionDate: true,
        department: { select: { name: true } },
      },
    }),
    prisma.asset.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        assetCode: true,
        name: true,
        status: true,
        updatedAt: true,
        department: { select: { name: true } },
      },
    }),
  ]);

  const departmentNameById = new Map(departments.map((d) => [d.id, d.name]));
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  const assetsByDepartment = assetsByDepartmentRaw.map((g) => ({
    departmentId: g.departmentId,
    departmentName: departmentNameById.get(g.departmentId) ?? "Unknown",
    count: g._count,
  }));

  const assetsByCategory = assetsByCategoryRaw.map((g) => ({
    categoryId: g.categoryId,
    categoryName: categoryNameById.get(g.categoryId) ?? "Unknown",
    count: g._count,
  }));

  const conditionDistribution = CONDITION_BANDS.map((b, i) => ({ band: b.band, count: conditionCounts[i] }));
  const riskDistribution = RISK_BANDS.map((b, i) => ({ band: b.band, count: riskCounts[i] }));

  const lifecycleDistribution = lifecycleDistributionRaw.map((g) => ({
    stage: g.lifecycleStage,
    count: g._count,
  }));

  const maintenanceStatus = maintenanceStatusRaw.map((g) => ({ status: g.status, count: g._count }));

  return {
    totalAssets,
    operationalAssets,
    maintenanceDue,
    overdueInspections,
    highRiskAssets,
    criticalAssets,
    retiredAssets,
    assetsUnderMaintenance,
    avgCondition: avgConditionAgg._avg.conditionScore ?? 0,
    assetsByDepartment,
    assetsByCategory,
    conditionDistribution,
    riskDistribution,
    lifecycleDistribution,
    maintenanceStatus,
    topRiskAssets,
    upcomingMaintenance,
    overdueInspectionsList,
    recentlyUpdatedAssets,
  };
}

export type DashboardMetrics = Awaited<ReturnType<typeof getDashboardMetrics>>;
