import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AssetCreateInput, AssetListQuery, AssetUpdateInput } from "@/lib/validation";
import { calculateAssetRisk, recalculateAndPersistRisk } from "@/server/risk";
import { createAuditLog, auditFieldDiffs } from "@/server/audit";
import { badRequest, conflict, notFound } from "@/server/errors";

const AUDITED_ASSET_FIELDS = [
  "name",
  "status",
  "conditionScore",
  "criticality",
  "lifecycleStage",
  "departmentId",
  "categoryId",
  "zone",
  "vendorId",
] as const;

export async function listAssets(query: AssetListQuery) {
  const where: Prisma.AssetWhereInput = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { assetCode: { contains: query.search, mode: "insensitive" } },
    ];
  }
  if (query.department) {
    where.department = {
      OR: [
        { id: query.department },
        { code: { equals: query.department, mode: "insensitive" } },
        { name: { equals: query.department, mode: "insensitive" } },
      ],
    };
  }
  if (query.category) {
    where.category = {
      OR: [
        { id: query.category },
        { code: { equals: query.category, mode: "insensitive" } },
        { name: { equals: query.category, mode: "insensitive" } },
      ],
    };
  }
  if (query.status) where.status = query.status;
  if (query.criticality) where.criticality = query.criticality;
  if (query.lifecycleStage) where.lifecycleStage = query.lifecycleStage;
  if (query.zone) where.zone = { equals: query.zone, mode: "insensitive" };
  if (query.minCondition !== undefined || query.maxCondition !== undefined) {
    where.conditionScore = { gte: query.minCondition, lte: query.maxCondition };
  }
  if (query.minRisk !== undefined || query.maxRisk !== undefined) {
    where.riskScore = { gte: query.minRisk, lte: query.maxRisk };
  }

  const [data, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortDir },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        assetCode: true,
        name: true,
        status: true,
        conditionScore: true,
        criticality: true,
        riskScore: true,
        lifecycleStage: true,
        zone: true,
        latitude: true,
        longitude: true,
        nextInspectionDate: true,
        updatedAt: true,
        department: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.asset.count({ where }),
  ]);

  return {
    data,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

// Single round trip for every relation the asset detail view needs —
// avoids the N+1 pattern of fetching the asset then separately querying
// each related table.
export async function getAssetDetail(id: string) {
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      department: true,
      category: true,
      vendor: true,
      lifecycleEvents: { orderBy: { eventDate: "desc" }, take: 50 },
      inspections: { orderBy: { inspectionDate: "desc" }, take: 50, include: { inspector: { select: { id: true, name: true } } } },
      workOrders: { orderBy: { createdAt: "desc" }, take: 50 },
      maintenanceRecords: { orderBy: { performedDate: "desc" }, take: 50 },
      documents: { orderBy: { uploadedAt: "desc" } },
      auditLogs: { orderBy: { timestamp: "desc" }, take: 50, include: { user: { select: { id: true, name: true } } } },
      relationshipsSource: { include: { targetAsset: { select: { id: true, assetCode: true, name: true, status: true } } } },
      relationshipsTarget: { include: { sourceAsset: { select: { id: true, assetCode: true, name: true, status: true } } } },
    },
  });

  if (!asset) throw notFound("Asset not found");
  return asset;
}

export async function createAsset(input: AssetCreateInput, actorUserId: string | null) {
  const [department, category, existing] = await Promise.all([
    prisma.department.findUnique({ where: { id: input.departmentId } }),
    prisma.assetCategory.findUnique({ where: { id: input.categoryId } }),
    prisma.asset.findUnique({ where: { assetCode: input.assetCode } }),
  ]);

  if (!department) throw badRequest("Invalid department");
  if (!category) throw badRequest("Invalid category");
  if (existing) throw conflict(`Asset code "${input.assetCode}" is already in use`);

  const { reasons: _reasons, ...risk } = calculateAssetRisk({
    conditionScore: input.conditionScore,
    criticality: input.criticality,
    status: input.status,
    nextInspectionDate: null,
    correctiveOrEmergencyCount: 0,
  });

  return prisma.$transaction(async (tx) => {
    const asset = await tx.asset.create({
      data: { ...input, riskScore: risk.riskScore },
    });

    await tx.lifecycleEvent.create({
      data: {
        assetId: asset.id,
        eventType: "ASSET_CREATED",
        eventDate: new Date(),
        description: `Asset registered in ${department.name}`,
        performedBy: actorUserId ?? undefined,
      },
    });

    await createAuditLog(tx, {
      userId: actorUserId,
      assetId: asset.id,
      action: "ASSET_CREATED",
      newValue: asset.assetCode,
    });

    return asset;
  });
}

export async function updateAsset(id: string, input: AssetUpdateInput, actorUserId: string | null) {
  const before = await prisma.asset.findUnique({ where: { id } });
  if (!before) throw notFound("Asset not found");

  if (input.departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: input.departmentId } });
    if (!dept) throw badRequest("Invalid department");
  }
  if (input.categoryId) {
    const cat = await prisma.assetCategory.findUnique({ where: { id: input.categoryId } });
    if (!cat) throw badRequest("Invalid category");
  }

  return prisma.$transaction(async (tx) => {
    const after = await tx.asset.update({ where: { id }, data: input });

    await auditFieldDiffs(tx, {
      userId: actorUserId,
      assetId: id,
      action: "ASSET_UPDATED",
      before: before as unknown as Record<string, unknown>,
      after: after as unknown as Record<string, unknown>,
      fields: [...AUDITED_ASSET_FIELDS],
    });

    if (input.lifecycleStage && input.lifecycleStage !== before.lifecycleStage) {
      await tx.lifecycleEvent.create({
        data: {
          assetId: id,
          eventType: "LIFECYCLE_STAGE_CHANGED",
          eventDate: new Date(),
          description: `${before.lifecycleStage} -> ${input.lifecycleStage}`,
          performedBy: actorUserId ?? undefined,
        },
      });
    }

    if (
      input.conditionScore !== undefined ||
      input.criticality !== undefined ||
      input.status !== undefined
    ) {
      await recalculateAndPersistRisk(tx as typeof prisma, id);
    }

    return tx.asset.findUniqueOrThrow({ where: { id } });
  });
}

// Infrastructure assets are retired, not deleted — this flips status/
// lifecycle instead of removing the row, per the "prefer soft deletion"
// requirement. Restricted to admins by the caller (route handler).
export async function retireAsset(id: string, actorUserId: string | null) {
  const before = await prisma.asset.findUnique({ where: { id } });
  if (!before) throw notFound("Asset not found");

  return prisma.$transaction(async (tx) => {
    const after = await tx.asset.update({
      where: { id },
      data: { status: "RETIRED", lifecycleStage: "RETIRED" },
    });

    await tx.lifecycleEvent.create({
      data: {
        assetId: id,
        eventType: "ASSET_RETIRED",
        eventDate: new Date(),
        performedBy: actorUserId ?? undefined,
      },
    });

    await createAuditLog(tx, {
      userId: actorUserId,
      assetId: id,
      action: "ASSET_RETIRED",
      oldValue: before.status,
      newValue: "RETIRED",
    });

    return after;
  });
}
