import { NextResponse } from "next/server";
import { listDepartments } from "@/server/departments";
import { handleApiError } from "@/server/errors";

export async function GET() {
  try {
    const data = await listDepartments();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
