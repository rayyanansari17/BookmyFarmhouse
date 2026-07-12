"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { ScrollText, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { IRequestLog, LogAction } from "@/lib/db/models/RequestLog.model";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACTION_BADGE: Record<LogAction, string> = {
  LOGIN:   "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  CREATE:  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  READ:    "bg-muted text-muted-foreground",
  LOGOUT:  "bg-muted text-muted-foreground",
  UPDATE:  "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  DELETE:  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const ACTION_OPTIONS = [
  { value: "all", label: "All actions" },
  { value: "LOGIN",  label: "LOGIN"  },
  { value: "LOGOUT", label: "LOGOUT" },
  { value: "CREATE", label: "CREATE" },
  { value: "READ",   label: "READ"   },
  { value: "UPDATE", label: "UPDATE" },
  { value: "DELETE", label: "DELETE" },
];

const LIMIT = 50;

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<IRequestLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLogs = useCallback(async (searchVal: string, actionVal: string, pageVal: number) => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: String(LIMIT),
      offset: String((pageVal - 1) * LIMIT),
    });
    if (actionVal !== "all") params.set("action", actionVal);
    if (searchVal) params.set("search", searchVal);

    const res = await fetch(`/api/logs?${params}`);
    const data = await res.json();
    if (data.success) { setLogs(data.data); setTotal(data.total); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(search, action, page); }, [fetchLogs, search, action, page]);

  const handleSearchChange = (value: string) => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 400);
  };

  const exportUrl = (format: "csv" | "log") => {
    const params = new URLSearchParams({ format });
    if (action !== "all") params.set("action", action);
    if (search) params.set("search", search);
    return `/api/logs/export?${params}`;
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">System Logs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Complete API audit trail — auto-expires after 90 days.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search actor or path…"
          className="h-9 w-56"
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        <Select value={action} onValueChange={(v) => { if (v) { setAction(v); setPage(1); } }}>
          <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => window.open(exportUrl("csv"), "_blank")}
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => window.open(exportUrl("log"), "_blank")}
          >
            <Download className="h-3.5 w-3.5" /> .log
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-x-auto">
        {/* Header */}
        <div className="min-w-[900px] grid grid-cols-[160px_200px_60px_90px_70px_1fr_110px] gap-3 px-4 py-2.5 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div>Timestamp</div>
          <div>Actor</div>
          <div>Role</div>
          <div>Action</div>
          <div>Method</div>
          <div>Path</div>
          <div>IP</div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="min-w-[900px] divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 mx-4 my-2 bg-muted/40 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty — no data at all */}
        {!loading && logs.length === 0 && !search && action === "all" && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground min-w-[900px]">
            <ScrollText className="h-10 w-10 opacity-30" />
            <p className="font-medium">No logs yet</p>
            <p className="text-sm">API requests will appear here once they&apos;re captured by the middleware.</p>
          </div>
        )}

        {/* Empty — due to active filters */}
        {!loading && logs.length === 0 && (search || action !== "all") && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground min-w-[900px]">
            <p className="font-medium">No results for current filters</p>
            <p className="text-sm">Try clearing the search or changing the action filter.</p>
          </div>
        )}

        {/* Rows */}
        {!loading && logs.length > 0 && (
          <div className="min-w-[900px] divide-y divide-border">
            {logs.map((log) => (
              <div
                key={log._id}
                className="grid grid-cols-[160px_200px_60px_90px_70px_1fr_110px] gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors items-center text-sm"
              >
                <div className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                </div>
                <div className="min-w-0">
                  <div className="text-foreground text-xs font-medium truncate">{log.userName ?? "—"}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{log.userEmail ?? "unauthenticated"}</div>
                </div>
                <div className="text-xs text-muted-foreground capitalize">{log.userRole ?? "—"}</div>
                <div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ACTION_BADGE[log.action as LogAction] ?? "bg-muted text-muted-foreground"}`}>
                    {log.action}
                  </span>
                </div>
                <div className="text-xs font-mono text-muted-foreground">{log.method}</div>
                <div className="text-xs font-mono text-foreground truncate" title={log.path}>{log.path}</div>
                <div className="text-xs text-muted-foreground font-mono truncate">{log.ipAddress ?? "—"}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {total.toLocaleString()} total
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
