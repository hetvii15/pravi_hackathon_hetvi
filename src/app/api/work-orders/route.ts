import { NextResponse, type NextRequest } from "next/server";
import { workOrderCreateSchema } from "@/lib/validation";
import { getRequestRole, getActingUserId, requireRole, ASSET_WRITE_ROLES, MAINTENANCE_WRITE_ROLES } from "@/server/authz";
import { handleApiError } from "@/server/errors";
import { listWorkOrders, createWorkOrder } from "@/server/workOrders";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const page = params.has("page") ? Number(params.get("page")) : undefined;
    const pageSize = params.has("pageSize") ? Number(params.get("pageSize")) : undefined;

    const result = await listWorkOrders({
      status: params.get("status") ?? undefined,
      priority: params.get("priority") ?? undefined,
      department: params.get("department") ?? undefined,
      category: params.get("category") ?? undefined,
      assetId: params.get("assetId") ?? undefined,
      assignedTo: params.get("assignedTo") ?? undefined,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const role = getRequestRole(request);
    requireRole(role, [...ASSET_WRITE_ROLES, ...MAINTENANCE_WRITE_ROLES]);
    const actorUserId = await getActingUserId(request);
    const body = workOrderCreateSchema.parse(await request.json());
    const result = await createWorkOrder(body, actorUserId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
