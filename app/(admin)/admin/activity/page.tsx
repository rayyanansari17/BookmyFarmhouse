"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Activity, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────

type EventType = "submitted" | "approved" | "rejected" | "edited" | "deleted" | "restored";

interface ActivityItem {
  _id: string;
  title: string;
  slug: string;
  eventType: EventType;
  note?: string;
  timestamp: string;
  actor?: {
    name?: string;
    email?: string;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EVENT_STYLES: Record<EventType, string> = {
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  approved:  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected:  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  edited:    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  deleted:   "bg-destructive/10 text-destructive border border-destructive/30",
  restored:  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

const EVENT_TYPES: { value: string; label: string }[] = [
  { value: "all", label: "All events" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "edited", label: "Edited" },
  { value: "deleted", label: "Deleted" },
  { value: "restored", label: "Restored" },
];

const LIMIT = 50;

// ─── Main ────────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(LIMIT), offset: String((page - 1) * LIMIT) });
    if (actionFilter !== "all") params.set("action", actionFilter);

    const res = await fetch(`/api/admin/activity?${params}`);
    const data = await res.json();
    if (data.success) { setItems(data.data); setTotal(data.total); }
    setLoading(false);
  }, [page, actionFilter]);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Domain events from all property listings.</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={actionFilter} onValueChange={(v) => { if (v) { setActionFilter(v); setPage(1); } }}>
          <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{total} event{total !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="hidden sm:grid grid-cols-[160px_140px_1fr_1fr_200px] gap-3 px-4 py-2.5 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div>Timestamp</div>
          <div>Event</div>
          <div>Property</div>
          <div>Actor</div>
          <div>Note</div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-muted/30 animate-pulse mx-4 my-3 rounded-lg" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Activity className="h-10 w-10 opacity-30" />
            <p className="font-medium">No activity recorded yet</p>
            <p className="text-sm">Property status changes and edits will appear here.</p>
          </div>
        )}

        {/* Rows */}
        {!loading && items.length > 0 && (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={`${item._id}-${item.timestamp}`}
                className="grid grid-cols-1 sm:grid-cols-[160px_140px_1fr_1fr_200px] gap-2 sm:gap-3 px-4 py-3 hover:bg-muted/20 transition-colors items-center"
              >
                <div className="text-xs text-muted-foreground tabular-nums">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </div>
                <div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${EVENT_STYLES[item.eventType] ?? "bg-muted text-muted-foreground"}`}>
                    {item.eventType}
                  </span>
                </div>
                <div className="text-sm font-medium text-foreground min-w-0">
                  <Link
                    href={`/listing/${item.slug}`}
                    target="_blank"
                    className="hover:text-primary transition-colors truncate block"
                  >
                    {item.title}
                  </Link>
                </div>
                <div className="text-xs text-muted-foreground min-w-0">
                  {item.actor?.name ?? <span className="italic">System</span>}
                  {item.actor?.email && (
                    <span className="block text-[10px] opacity-70 truncate">{item.actor.email}</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground italic truncate">{item.note ?? "—"}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
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
