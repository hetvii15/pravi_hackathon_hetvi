import { NextRequest, NextResponse } from "next/server";
import { getDepartmentDetail } from "@/server/departments";
import { handleApiError } from "@/server/errors";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await getDepartmentDetail(id);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
