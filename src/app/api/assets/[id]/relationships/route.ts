import { NextRequest, NextResponse } from "next/server";
import { ASSET_WRITE_ROLES, getActingUserId, getRequestRole, requireRole } from "@/server/authz";
import { handleApiError } from "@/server/errors";
import { createRelationship, listRelationshipsForAsset } from "@/server/relationships";
import { relationshipCreateSchema } from "@/lib/validation";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json(await listRelationshipsForAsset(id));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const role = getRequestRole(request);
    requireRole(role, ASSET_WRITE_ROLES);
    const actorUserId = await getActingUserId(request);
    const body = relationshipCreateSchema.parse(await request.json());
    const rel = await createRelationship(id, body, actorUserId);
    return NextResponse.json(rel, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
