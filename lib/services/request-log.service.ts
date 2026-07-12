import { connectDB } from "@/lib/db/mongoose";
import RequestLog, { LogAction } from "@/lib/db/models/RequestLog.model";

export type { LogAction };

export interface LogEntry {
  action: LogAction;
  method: string;
  path: string;
  status?: number | null;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  ipAddress?: string | null;
}

export interface ListLogsFilter {
  action?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export function actionForMethod(method: string): LogAction {
  switch (method.toUpperCase()) {
    case "POST":   return "CREATE";
    case "PATCH":
    case "PUT":    return "UPDATE";
    case "DELETE": return "DELETE";
    default:       return "READ";
  }
}

export async function logApiRequest(entry: LogEntry): Promise<void> {
  await connectDB();
  await RequestLog.create({
    action: entry.action,
    method: entry.method,
    path: entry.path,
    status: entry.status ?? null,
    userId: entry.userId ?? null,
    userName: entry.userName ?? null,
    userEmail: entry.userEmail ?? null,
    userRole: entry.userRole ?? null,
    ipAddress: entry.ipAddress ?? null,
  });
}

function buildFilter(filters: ListLogsFilter) {
  const query: Record<string, unknown> = {};
  if (filters.action) query.action = filters.action;
  if (filters.search) {
    const re = new RegExp(filters.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ path: re }, { userName: re }, { userEmail: re }];
  }
  return query;
}

export async function listApiRequestLogs(filters: ListLogsFilter) {
  await connectDB();
  const limit = Math.min(filters.limit ?? 50, 1000);
  const offset = filters.offset ?? 0;
  const query = buildFilter(filters);

  const [items, total] = await Promise.all([
    RequestLog.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
    RequestLog.countDocuments(query),
  ]);

  return { items, total };
}

function escapeCsvCell(value: unknown): string {
  const str = value == null ? "" : String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function exportApiRequestLogsCsv(filters: ListLogsFilter): Promise<string> {
  await connectDB();
  const query = buildFilter(filters);
  const logs = await RequestLog.find(query).sort({ createdAt: -1 }).limit(1000).lean();

  const header = ["timestamp", "action", "method", "path", "status", "userId", "userName", "userEmail", "userRole", "ipAddress"];
  const rows = logs.map((l) => [
    l.createdAt.toISOString(),
    l.action, l.method, l.path,
    l.status ?? "",
    l.userId ?? "", l.userName ?? "", l.userEmail ?? "", l.userRole ?? "",
    l.ipAddress ?? "",
  ].map(escapeCsvCell).join(","));

  return [header.join(","), ...rows].join("\n");
}

export async function exportApiRequestLogsText(filters: ListLogsFilter): Promise<string> {
  await connectDB();
  const query = buildFilter(filters);
  const logs = await RequestLog.find(query).sort({ createdAt: -1 }).limit(1000).lean();

  return logs.map((l) => {
    const ts = l.createdAt.toISOString();
    const actor = l.userEmail ? `${l.userName ?? "unknown"} <${l.userEmail}> [${l.userRole ?? "?"}]` : "unauthenticated";
    const status = l.status ? ` → ${l.status}` : "";
    const ip = l.ipAddress ? ` from ${l.ipAddress}` : "";
    return `[${ts}] ${l.action.padEnd(7)} ${l.method.padEnd(7)} ${l.path}${status} | ${actor}${ip}`;
  }).join("\n");
}
