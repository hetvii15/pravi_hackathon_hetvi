import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/server/dashboard";
import { handleApiError } from "@/server/errors";

export async function GET() {
  try {
    const data = await getDashboardMetrics();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
