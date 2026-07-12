import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

// Paths that self-log (login/logout) or are the ingest endpoint itself
const LOG_SKIP_PREFIXES = ["/api/auth/", "/api/logs/ingest"];

function methodToAction(method: string): string {
  switch (method.toUpperCase()) {
    case "POST":   return "CREATE";
    case "PATCH":
    case "PUT":    return "UPDATE";
    case "DELETE": return "DELETE";
    default:       return "READ";
  }
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // ── Fire-and-forget API request logging ───────────────────────────────────
  if (
    pathname.startsWith("/api/") &&
    !LOG_SKIP_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;

    fetch(new URL("/api/logs/ingest", req.url).toString(), {
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
        userId: session?.user?.id ?? null,
        userName: session?.user?.name ?? null,
        userEmail: session?.user?.email ?? null,
        userRole: session?.user?.role ?? null,
        ipAddress: ip,
      }),
    }).catch((err) => console.error("[log-proxy]", err));
  }

  // ── Redirect already-logged-in users away from login pages ───────────────
  if (pathname === "/admin/login" && session?.user.role === "admin") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  if (
    (pathname === "/vendor/login" || pathname === "/vendor/register") &&
    session?.user.role === "vendor"
  ) {
    return NextResponse.redirect(new URL("/vendor", req.url));
  }

  // ── Vendor routes ─────────────────────────────────────────────────────────
  const isVendorPublic =
    pathname === "/vendor/login" ||
    pathname === "/vendor/register" ||
    pathname === "/vendor/onboarding";

  if (pathname.startsWith("/vendor") && !isVendorPublic) {
    if (!session || session.user.role !== "vendor") {
      return NextResponse.redirect(new URL("/vendor/login", req.url));
    }
  }

  // ── Admin routes ──────────────────────────────────────────────────────────
  const isAdminPublic = pathname === "/admin/login";

  if (pathname.startsWith("/admin") && !isAdminPublic) {
    if (!session || session.user.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/vendor/:path*", "/admin/:path*", "/api/:path*"],
};
