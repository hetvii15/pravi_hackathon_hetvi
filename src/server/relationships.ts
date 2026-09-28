import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/server/audit";
import { badRequest, notFound } from "@/server/errors";
import type { RelationshipCreateInput } from "@/lib/validation";

// Relationships are bidirectional in meaning but stored as directed rows
// (source -> target). Listing for an asset returns both directions so the
// UI can show "this asset depends on X" and "Y depends on this asset"
// without the caller needing to know which side the asset was created on.
export async function listRelationshipsForAsset(assetId: string) {
  const [outgoing, incoming] = await Promise.all([
    prisma.assetRelationship.findMany({
      where: { sourceAssetId: assetId },
      include: {
        targetAsset: { select: { id: true, assetCode: true, name: true, status: true } },
      },
    }),
    prisma.assetRelationship.findMany({
      where: { targetAssetId: assetId },
      include: {
        sourceAsset: { select: { id: true, assetCode: true, name: true, status: true } },
      },
    }),
  ]);
  return { outgoing, incoming };
}

export async function createRelationship(
  sourceAssetId: string,
  input: RelationshipCreateInput,
  actorUserId: string | null
) {
  if (sourceAssetId === input.targetAssetId) throw badRequest("An asset cannot relate to itself");

  const [source, target] = await Promise.all([
    prisma.asset.findUnique({ where: { id: sourceAssetId } }),
    prisma.asset.findUnique({ where: { id: input.targetAssetId } }),
  ]);
  if (!source) throw notFound("Source asset not found");
  if (!target) throw notFound("Target asset not found");

  return prisma.$transaction(async (tx) => {
    const relationship = await tx.assetRelationship.create({
      data: {
        sourceAssetId,
        targetAssetId: input.targetAssetId,
        relationshipType: input.relationshipType,
      },
    });
    await createAuditLog(tx, {
      userId: actorUserId,
      assetId: sourceAssetId,
      action: "RELATIONSHIP_CREATED",
      newValue: `${input.relationshipType} -> ${target.assetCode}`,
    });
    return relationship;
  });
}

export async function deleteRelationship(id: string, actorUserId: string | null) {
  const existing = await prisma.assetRelationship.findUnique({ where: { id } });
  if (!existing) throw notFound("Relationship not found");

  return prisma.$transaction(async (tx) => {
    await tx.assetRelationship.delete({ where: { id } });
    await createAuditLog(tx, {
      userId: actorUserId,
      assetId: existing.sourceAssetId,
      action: "RELATIONSHIP_DELETED",
      oldValue: existing.relationshipType,
    });
    return { success: true };
  });
}
