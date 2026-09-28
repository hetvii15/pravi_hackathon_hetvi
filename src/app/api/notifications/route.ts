import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/server/errors";
import { listNotifications } from "@/server/notifications";

export async function GET(request: NextRequest) {
  try {
    const unreadOnly = request.nextUrl.searchParams.get("unreadOnly") === "true";
    const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
    const pageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? "30");
    return NextResponse.json(await listNotifications({ unreadOnly, page, pageSize }));
  } catch (error) {
    return handleApiError(error);
  }
}
