import { NextResponse, type NextRequest } from "next/server";
import { workOrderUpdateSchema } from "@/lib/validation";
import { getRequestRole, getActingUserId, requireRole, MAINTENANCE_WRITE_ROLES } from "@/server/authz";
import { handleApiError } from "@/server/errors";
import { updateWorkOrder } from "@/server/workOrders";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const role = getRequestRole(request);
    requireRole(role, MAINTENANCE_WRITE_ROLES);
    const actorUserId = await getActingUserId(request);
    const body = workOrderUpdateSchema.parse(await request.json());
    const result = await updateWorkOrder(id, body, actorUserId);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
