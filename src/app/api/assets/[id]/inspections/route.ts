import { NextRequest, NextResponse } from "next/server";
import { inspectionCreateSchema } from "@/lib/validation";
import { listInspectionsForAsset, createInspection } from "@/server/inspections";
import { getRequestRole, getActingUserId, requireRole, INSPECTION_WRITE_ROLES } from "@/server/authz";
import { handleApiError } from "@/server/errors";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json(await listInspectionsForAsset(id));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const role = getRequestRole(request);
    requireRole(role, INSPECTION_WRITE_ROLES);
    const actorUserId = await getActingUserId(request);
    const body = inspectionCreateSchema.parse(await request.json());
    const result = await createInspection(id, body, actorUserId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
