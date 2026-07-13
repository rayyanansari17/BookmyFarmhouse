import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

const SEO_JOB_SERVICE_URL = process.env.SEO_JOB_SERVICE_URL ?? "";
const SEO_JOB_SECRET = process.env.SEO_JOB_SECRET ?? "";

const VALID_TYPES = [
  "sync-gsc",
  "sync-ga4",
  "sync-cwv",
  "sync-rank-tracking",
  "run-triggers",
  "gen-suggestions",
] as const;

export async function POST(req: NextRequest) {
  // Allow both session-based (admin UI) and cron-based (Vercel Cron) triggers
  const session = await auth();
  const isAdminSession = session?.user.role === "admin";
  const cronSecret = req.headers.get("x-vercel-cron-secret") ?? req.headers.get("authorization");
  const isCronTrigger = cronSecret === process.env.CRON_SECRET;

  if (!isAdminSession && !isCronTrigger) {
    // Also check URL param for Vercel Cron (which passes no body)
    const type = req.nextUrl.searchParams.get("type");
    if (!type) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
  }

  const body = req.method === "GET" ? {} : await req.json().catch(() => ({}));
  const type = (body as { type?: string }).type ?? req.nextUrl.searchParams.get("type");

  if (!type || !VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
    return NextResponse.json(
      { success: false, error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if (!SEO_JOB_SERVICE_URL) {
    return NextResponse.json(
      { success: false, error: "SEO_JOB_SERVICE_URL not configured" },
      { status: 503 }
    );
  }

  const res = await fetch(`${SEO_JOB_SERVICE_URL}/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-seo-secret": SEO_JOB_SECRET,
    },
    body: JSON.stringify({ type }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ success: false, error: `Job service error: ${err}` }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json({ success: true, data });
}

// Vercel Cron calls GET — support both
export { POST as GET };
