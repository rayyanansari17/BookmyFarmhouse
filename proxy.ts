import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

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
  // Do NOT include /api/:path* here — the auth() wrapper causes cross-origin
  // redirect issues when RSC navigation crosses the custom domain / Vercel domain boundary.
  // API logging is handled via NextAuth events (login/logout) instead.
  matcher: ["/vendor/:path*", "/admin/:path*"],
};
