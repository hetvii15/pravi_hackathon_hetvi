import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

// Business-logic error with an explicit HTTP status. Route handlers throw
// this for expected failure cases (not found, duplicate, forbidden, bad
// input) and let handleApiError() turn it into a clean JSON response.
export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = "ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function notFound(message = "Not found") {
  return new ApiError(404, message, "NOT_FOUND");
}

export function forbidden(message = "Not permitted for this role") {
  return new ApiError(403, message, "FORBIDDEN");
}

export function badRequest(message: string) {
  return new ApiError(400, message, "BAD_REQUEST");
}

export function conflict(message: string) {
  return new ApiError(409, message, "CONFLICT");
}

// Never leak stack traces or raw DB errors to the client — map known error
// shapes to a clear message + status, and fall back to a generic 500.
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: { message: error.message, code: error.code } }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          issues: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: { message: "A record with this unique value already exists", code: "DUPLICATE" } },
        { status: 409 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json({ error: { message: "Record not found", code: "NOT_FOUND" } }, { status: 404 });
    }
  }

  console.error("Unhandled API error:", error);
  return NextResponse.json(
    { error: { message: "Internal server error", code: "INTERNAL_ERROR" } },
    { status: 500 }
  );
}
