"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Users, ShieldOff, ShieldCheck, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import type { IUser } from "@/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState<{ user: IUser; action: "suspend" | "activate" } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const limit = 15;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search && { search }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
        setTotal(data.pagination.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleStatusChange = async () => {
    if (!confirmDialog) return;
    setActionLoading(true);
    const { user, action } = confirmDialog;
    const isSuspend = action === "suspend";
    try {
      const res = await fetch(`/api/admin/users/${user._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSuspended: isSuspend }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setUsers((prev) => prev.map((u) => u._id === user._id ? { ...u, isSuspended: isSuspend } : u));
      toast.success(`Vendor ${isSuspend ? "suspended" : "activated"}`);
      setConfirmDialog(null);
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Vendors</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{total} vendor accounts</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchUsers(); }} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline">Search</Button>
        </form>
        <Select value={statusFilter} onValueChange={(v) => { if (v) { setStatusFilter(v); setPage(1); } }}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No vendors found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          {user.profileImage && <AvatarImage src={user.profileImage} />}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[160px]">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.businessName || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.phone || "—"}</TableCell>
                    <TableCell>
                      {user.isSuspended ? (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 text-xs">Suspended</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 text-xs">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        {user.isSuspended ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-xs text-green-700 border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                            onClick={() => setConfirmDialog({ user, action: "activate" })}
                          >
                            <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Activate
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-xs text-red-700 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => setConfirmDialog({ user, action: "suspend" })}
                          >
                            <ShieldOff className="h-3.5 w-3.5 mr-1" /> Suspend
                          </Button>
                        )}
                      </div>
                    </TableCell>
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

      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog?.action === "suspend" ? "Suspend Vendor" : "Activate Vendor"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog?.action === "suspend"
                ? `Are you sure you want to suspend ${confirmDialog.user.name}? They won't be able to log in and their listings will be hidden.`
                : `Restore access for ${confirmDialog?.user.name}? Their listings will be reinstated.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancel</Button>
            <Button
              variant={confirmDialog?.action === "suspend" ? "destructive" : "default"}
              onClick={handleStatusChange}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {confirmDialog?.action === "suspend" ? "Suspend" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
