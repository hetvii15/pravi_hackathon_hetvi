import { NextResponse, type NextRequest } from "next/server";
import { workOrderUpdateSchema } from "@/lib/validation";
import { getRequestRole, getActingUser, requireRole, MAINTENANCE_WRITE_ROLES } from "@/server/authz";
import { handleApiError } from "@/server/errors";
import { updateWorkOrder } from "@/server/workOrders";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const role = getRequestRole(request);
    requireRole(role, MAINTENANCE_WRITE_ROLES);
    const user = await getActingUser(role);
    const body = workOrderUpdateSchema.parse(await request.json());
    const result = await updateWorkOrder(id, body, user?.id ?? null);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
