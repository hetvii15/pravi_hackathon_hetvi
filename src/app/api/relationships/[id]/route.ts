import { NextRequest, NextResponse } from "next/server";
import { ASSET_WRITE_ROLES, getActingUserId, getRequestRole, requireRole } from "@/server/authz";
import { handleApiError } from "@/server/errors";
import { deleteRelationship } from "@/server/relationships";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const role = getRequestRole(request);
    requireRole(role, ASSET_WRITE_ROLES);
    const actorUserId = await getActingUserId(request);
    const result = await deleteRelationship(id, actorUserId);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
