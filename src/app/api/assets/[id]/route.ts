import { NextRequest, NextResponse } from "next/server";
import { assetUpdateSchema } from "@/lib/validation";
import { getAssetDetail, updateAsset } from "@/server/assets";
import { getRequestRole, getActingUser, requireRole, ASSET_WRITE_ROLES } from "@/server/authz";
import { handleApiError } from "@/server/errors";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json(await getAssetDetail(id));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const role = getRequestRole(request);
    requireRole(role, ASSET_WRITE_ROLES);
    const user = await getActingUser(role);
    const body = assetUpdateSchema.parse(await request.json());
    return NextResponse.json(await updateAsset(id, body, user?.id ?? null));
  } catch (error) {
    return handleApiError(error);
  }
}
