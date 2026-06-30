"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Phone, Mail, Calendar, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDate, getStatusColor } from "@/lib/utils";
import type { IInquiry } from "@/types";

const STATUS_OPTIONS = ["all", "new", "contacted", "converted", "closed"] as const;

export default function LeadsDashboard() {
  const [leads, setLeads] = useState<IInquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/vendor/inquiries?${params}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.data);
        setTotal(data.pagination.total);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/vendor/inquiries/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setLeads((prev) =>
        prev.map((l) => (l._id === id ? { ...l, status: status as IInquiry["status"] } : l))
      );
      toast.success("Status updated");
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = leads.filter(
    (l) =>
      l.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      l.customer.email.toLowerCase().includes(search.toLowerCase()) ||
      l.customer.phone.includes(search)
  );

  const statusCounts = leads.reduce(
    (acc, l) => ({ ...acc, [l.status]: (acc[l.status] ?? 0) + 1 }),
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Leads</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{total} total inquiries received</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {s} {s !== "all" && statusCounts[s] ? `(${statusCounts[s]})` : ""}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lead cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="font-semibold text-foreground mb-1">No leads yet</h3>
          <p className="text-sm text-muted-foreground">
            {search || statusFilter !== "all"
              ? "No leads match your filters"
              : "Leads appear here when customers inquire about your listings"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((lead) => (
            <Card key={lead._id} className="border-border hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                      {lead.customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{lead.customer.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{lead.eventType} event</p>
                    </div>
                  </div>
                  <Select
                    value={lead.status}
                    onValueChange={(v) => v && updateStatus(lead._id, v)}
                    disabled={updatingId === lead._id}
                  >
                    <SelectTrigger className="h-7 text-xs w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.filter((s) => s !== "all").map((s) => (
                        <SelectItem key={s} value={s} className="text-xs capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    <a href={`tel:${lead.customer.phone}`} className="hover:text-primary">
                      {lead.customer.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    <a href={`mailto:${lead.customer.email}`} className="hover:text-primary truncate">
                      {lead.customer.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      {formatDate(lead.eventDate)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      {lead.guestCount} guests
                    </div>
                  </div>
                </div>

                {lead.message && (
                  <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border line-clamp-2">
                    &quot;{lead.message}&quot;
                  </p>
                )}

                <div className="flex items-center justify-between mt-3 pt-2">
                  <span className="text-xs text-muted-foreground">
                    Received {formatDate(lead.createdAt)}
                  </span>
                  <Badge
                    variant="secondary"
                    className={`text-xs capitalize ${getStatusColor(lead.status)}`}
                  >
                    {lead.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
