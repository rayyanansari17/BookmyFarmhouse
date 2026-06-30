"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, MessageSquare, ChevronLeft, ChevronRight, Phone, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { IInquiry } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  contacted: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  booked: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  closed: "bg-muted text-muted-foreground",
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<IInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });
      const res = await fetch(`/api/admin/inquiries?${params}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.data);
        setTotal(data.pagination.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">All Leads</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{total} total inquiries on the platform</p>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={(v) => { if (v) { setStatusFilter(v); setPage(1); } }}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No leads found
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-bold shrink-0">
                          {lead.customer.name.charAt(0)}
                        </div>
                        <p className="text-sm font-medium text-foreground">{lead.customer.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" /> {lead.customer.phone}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" /> {lead.customer.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[140px] truncate">
                      {typeof lead.propertyId === "object" && lead.propertyId !== null
                        ? (lead.propertyId as { title?: string }).title ?? "—"
                        : "—"
                      }
                    </TableCell>
                    <TableCell className="text-sm capitalize text-muted-foreground">{lead.eventType}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{lead.guestCount}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs capitalize border-0 ${STATUS_STYLES[lead.status] ?? ""}`}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(lead.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
