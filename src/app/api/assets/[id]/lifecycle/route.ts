import { NextRequest, NextResponse } from "next/server";
import { lifecycleEventCreateSchema } from "@/lib/validation";
import { listLifecycleEventsForAsset, createLifecycleEvent } from "@/server/lifecycle";
import { getRequestRole, getActingUser, requireRole, ASSET_WRITE_ROLES } from "@/server/authz";
import { handleApiError } from "@/server/errors";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json(await listLifecycleEventsForAsset(id));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const role = getRequestRole(request);
    requireRole(role, ASSET_WRITE_ROLES);
    const user = await getActingUser(role);
    const body = lifecycleEventCreateSchema.parse(await request.json());
    const event = await createLifecycleEvent(id, body, user?.id ?? null);
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
