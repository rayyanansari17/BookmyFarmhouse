"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, Users, MessageSquare, Clock, CheckCircle, XCircle, Star, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import type { IProperty, IInquiry } from "@/types";

export default function AdminDashboard() {
  const [pendingListings, setPendingListings] = useState<IProperty[]>([]);
  const [recentLeads, setRecentLeads] = useState<IInquiry[]>([]);
  const [stats, setStats] = useState({
    totalListings: 0,
    pendingCount: 0,
    totalLeads: 0,
    totalVendors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [propRes, leadsRes, usersRes] = await Promise.all([
          fetch("/api/admin/properties?limit=10"),
          fetch("/api/admin/inquiries?limit=5"),
          fetch("/api/admin/users?limit=1"),
        ]);
        const [propData, leadsData, usersData] = await Promise.all([
          propRes.json(), leadsRes.json(), usersRes.json(),
        ]);

        if (propData.success) {
          const pending = (propData.data as IProperty[]).filter((p) => p.status === "pending");
          setPendingListings(pending.slice(0, 5));
          setStats((s) => ({
            ...s,
            totalListings: propData.pagination.total,
            pendingCount: pending.length,
          }));
        }
        if (leadsData.success) {
          setRecentLeads(leadsData.data);
          setStats((s) => ({ ...s, totalLeads: leadsData.pagination.total }));
        }
        if (usersData.success) {
          setStats((s) => ({ ...s, totalVendors: usersData.pagination.total }));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleStatus = async (id: string, status: "approved" | "rejected") => {
    setActionLoading(`${id}-${status}`);
    try {
      const res = await fetch(`/api/admin/properties/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setPendingListings((prev) => prev.filter((p) => p._id !== id));
      toast.success(`Listing ${status}`);
    } catch (err) {
      toast.error("Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const STATS = [
    { label: "Total Listings", value: stats.totalListings, icon: Building2, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20", href: "/admin/listings" },
    { label: "Pending Review", value: stats.pendingCount, icon: Clock, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20", href: "/admin/pending" },
    { label: "Total Leads", value: stats.totalLeads, icon: MessageSquare, color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20", href: "/admin/leads" },
    { label: "Active Vendors", value: stats.totalVendors, icon: Users, color: "text-green-600 bg-green-50 dark:bg-green-900/20", href: "/admin/users" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Platform overview and quick actions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href}>
            <Card className="hover:shadow-md transition-shadow border-border cursor-pointer">
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                {loading ? <Skeleton className="h-7 w-12 mb-1" /> : (
                  <div className="text-2xl font-bold text-foreground">{value}</div>
                )}
                <div className="text-xs text-muted-foreground">{label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending listings — quick approve/reject */}
        <div className="lg:col-span-2">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">Pending Listings</CardTitle>
              <Link href="/admin/pending">
                <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
              ) : pendingListings.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">All listings reviewed!</p>
                </div>
              ) : (
                pendingListings.map((listing) => (
                  <div key={listing._id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted shrink-0">
                      {listing.images?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={listing.images[0].url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{listing.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{listing.location.city}{listing.priceRange?.min ? ` · ${formatCurrency(listing.priceRange.min)}` : ""}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs text-green-700 border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                        disabled={!!actionLoading}
                        onClick={() => handleStatus(listing._id, "approved")}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs text-red-700 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                        disabled={!!actionLoading}
                        onClick={() => handleStatus(listing._id, "rejected")}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent leads */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent Leads</CardTitle>
            <Link href="/admin/leads">
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : recentLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No leads yet</p>
            ) : (
              recentLeads.map((lead) => (
                <div key={lead._id} className="flex items-start gap-2">
                  <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-bold shrink-0 mt-0.5">
                    {lead.customer.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{lead.customer.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(lead.createdAt)}</p>
                  </div>
                  <Badge variant="secondary" className={`text-xs capitalize shrink-0 ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
