import { NextResponse, type NextRequest } from "next/server";

// Kept as a literal here (not imported from src/lib/session.ts) so this
// edge-runtime file never pulls in next/headers, which session.ts uses and
// which isn't meant for middleware.
const SESSION_COOKIE = "infra360_session";

const PUBLIC_PATHS = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (isPublic) {
    if (hasSession && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except API routes and Next.js internals/static assets — API
  // auth is enforced per-route in src/server/authz.ts instead, so tools and
  // direct API calls keep working without a browser session.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
