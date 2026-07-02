import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

export default auth((req) => {
  const session = req.auth;
  const { pathname } = req.nextUrl;

  // Already-logged-in admin visiting login page → redirect to dashboard
  if (pathname === "/admin/login" && session?.user.role === "admin") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  // Already-logged-in vendor visiting login/register → redirect to dashboard
  if (
    (pathname === "/vendor/login" || pathname === "/vendor/register") &&
    session?.user.role === "vendor"
  ) {
    return NextResponse.redirect(new URL("/vendor", req.url));
  }

  // Protect admin routes (everything under /admin except /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!session || session.user.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // Protect vendor routes (everything under /vendor except login/register)
  const vendorPublicPaths = ["/vendor/login", "/vendor/register"];
  if (
    pathname.startsWith("/vendor") &&
    !vendorPublicPaths.some((p) => pathname.startsWith(p))
  ) {
    if (!session || session.user.role !== "vendor") {
      return NextResponse.redirect(new URL("/vendor/login", req.url));
    }
  }
});

export const config = {
  matcher: ["/admin/:path*", "/vendor/:path*"],
};
