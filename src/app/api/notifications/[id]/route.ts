import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/server/errors";
import { setNotificationRead } from "@/server/notifications";
import { notificationUpdateSchema } from "@/lib/validation";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = notificationUpdateSchema.parse(await request.json());
    return NextResponse.json(await setNotificationRead(id, body.isRead));
  } catch (error) {
    return handleApiError(error);
  }
}
