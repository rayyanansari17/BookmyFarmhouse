import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Paths that self-log (login/logout) or are the ingest endpoint itself
const SKIP_PREFIXES = ["/api/auth/", "/api/logs/ingest"];

// Derive a log action from an HTTP method (mirrors actionForMethod in request-log.service.ts
// — duplicated here because the service uses Mongoose which can't run in Edge runtime)
function methodToAction(method: string): string {
  switch (method.toUpperCase()) {
    case "POST":   return "CREATE";
    case "PATCH":
    case "PUT":    return "UPDATE";
    case "DELETE": return "DELETE";
    default:       return "READ";
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/api/") &&
    !SKIP_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;

    const ingestUrl = new URL("/api/logs/ingest", req.url).toString();

    fetch(ingestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-log-secret": process.env.LOG_INGEST_SECRET ?? "",
      },
      body: JSON.stringify({
        action: methodToAction(req.method),
        method: req.method,
        path: pathname,
        status: null,
        userId: token?.sub ?? null,
        userName: (token?.name as string | undefined) ?? null,
        userEmail: (token?.email as string | undefined) ?? null,
        userRole: (token?.role as string | undefined) ?? null,
        ipAddress: ip,
      }),
    }).catch((err) => console.error("[log-middleware]", err));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
