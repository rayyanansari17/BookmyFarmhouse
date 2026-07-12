import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { exportApiRequestLogsCsv, exportApiRequestLogsText } from "@/lib/services/request-log.service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const action = searchParams.get("action") || undefined;
  const search = searchParams.get("search") || undefined;
  const format = searchParams.get("format") === "log" ? "log" : "csv";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

  if (format === "log") {
    const body = await exportApiRequestLogsText({ action, search });
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="logs-${timestamp}.log"`,
      },
    });
  }

  const body = await exportApiRequestLogsCsv({ action, search });
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="logs-${timestamp}.csv"`,
    },
  });
}
