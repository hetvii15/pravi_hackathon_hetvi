import { prisma } from "@/lib/prisma";
import { notFound } from "@/server/errors";

// Duplicated from src/server/dashboard.ts on purpose — small bucket-count
// logic, not worth sharing across the two modules given the timeline.
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

export async function listDepartments() {
  const departments = await prisma.department.findMany({
    include: { categories: true },
    orderBy: { name: "asc" },
  });

  const now = new Date();

  return Promise.all(
    departments.map(async (dept) => {
      const [assetCount, avgConditionAgg, highRiskCount, maintenanceDueCount, overdueInspectionCount] =
        await Promise.all([
          prisma.asset.count({ where: { departmentId: dept.id } }),
          prisma.asset.aggregate({ where: { departmentId: dept.id }, _avg: { conditionScore: true } }),
          prisma.asset.count({ where: { departmentId: dept.id, riskScore: { gte: 50 } } }),
          prisma.asset.count({ where: { departmentId: dept.id, status: "MAINTENANCE" } }),
          prisma.asset.count({ where: { departmentId: dept.id, nextInspectionDate: { lt: now } } }),
        ]);

      return {
        ...dept,
        assetCount,
        avgConditionScore: avgConditionAgg._avg.conditionScore ?? 0,
        highRiskCount,
        maintenanceDueCount,
        overdueInspectionCount,
      };
    })
  );
}

export async function getDepartmentDetail(id: string) {
  const department = await prisma.department.findUnique({
    where: { id },
    include: { categories: true },
  });

  if (!department) throw notFound(`Department ${id} not found`);

  const now = new Date();

  const [
    assetCount,
    avgConditionAgg,
    highRiskCount,
    maintenanceDueCount,
    overdueInspectionCount,
    conditionCounts,
    riskCounts,
  ] = await Promise.all([
    prisma.asset.count({ where: { departmentId: id } }),
    prisma.asset.aggregate({ where: { departmentId: id }, _avg: { conditionScore: true } }),
    prisma.asset.count({ where: { departmentId: id, riskScore: { gte: 50 } } }),
    prisma.asset.count({ where: { departmentId: id, status: "MAINTENANCE" } }),
    prisma.asset.count({ where: { departmentId: id, nextInspectionDate: { lt: now } } }),
    Promise.all(
      CONDITION_BANDS.map((b) =>
        prisma.asset.count({ where: { departmentId: id, conditionScore: { gte: b.gte, lte: b.lte } } })
      )
    ),
    Promise.all(
      RISK_BANDS.map((b) =>
        prisma.asset.count({ where: { departmentId: id, riskScore: { gte: b.gte, lte: b.lte } } })
      )
    ),
  ]);

  return {
    ...department,
    assetCount,
    avgConditionScore: avgConditionAgg._avg.conditionScore ?? 0,
    highRiskCount,
    maintenanceDueCount,
    overdueInspectionCount,
    conditionDistribution: CONDITION_BANDS.map((b, i) => ({ band: b.band, count: conditionCounts[i] })),
    riskDistribution: RISK_BANDS.map((b, i) => ({ band: b.band, count: riskCounts[i] })),
  };
}

export type DepartmentSummary = Awaited<ReturnType<typeof listDepartments>>[number];
export type DepartmentDetail = Awaited<ReturnType<typeof getDepartmentDetail>>;
