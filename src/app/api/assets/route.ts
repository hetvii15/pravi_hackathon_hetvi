import { NextRequest, NextResponse } from "next/server";
import { assetCreateSchema, assetListQuerySchema } from "@/lib/validation";
import { listAssets, createAsset } from "@/server/assets";
import { getRequestRole, getActingUser, requireRole, ASSET_WRITE_ROLES } from "@/server/authz";
import { handleApiError } from "@/server/errors";

export async function GET(request: NextRequest) {
  try {
    const query = assetListQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    return NextResponse.json(await listAssets(query));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const role = getRequestRole(request);
    requireRole(role, ASSET_WRITE_ROLES);
    const user = await getActingUser(role);
    const body = assetCreateSchema.parse(await request.json());
    const asset = await createAsset(body, user?.id ?? null);
    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
