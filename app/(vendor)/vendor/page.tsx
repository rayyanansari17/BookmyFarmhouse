"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Building2, MessageSquare, Clock, TrendingUp, Plus, ArrowRight, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import type { IProperty, IInquiry } from "@/types";

interface DashboardStats {
  totalListings: number;
  totalLeads: number;
  pendingListings: number;
  convertedLeads: number;
}

export default function VendorDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentListings, setRecentListings] = useState<IProperty[]>([]);
  const [recentLeads, setRecentLeads] = useState<IInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [listingsRes, leadsRes] = await Promise.all([
          fetch("/api/vendor/properties?limit=5"),
          fetch("/api/vendor/inquiries?limit=5"),
        ]);
        const [listingsData, leadsData] = await Promise.all([
          listingsRes.json(),
          leadsRes.json(),
        ]);

        if (listingsData.success) {
          setRecentListings(listingsData.data);
          const all = listingsData.data as IProperty[];
          setStats((prev) => ({
            ...prev!,
            totalListings: listingsData.pagination.total,
            pendingListings: all.filter((p) => p.status === "pending").length,
          }));
        }

        if (leadsData.success) {
          setRecentLeads(leadsData.data);
          const all = leadsData.data as IInquiry[];
          setStats((prev) => ({
            totalListings: prev?.totalListings ?? 0,
            pendingListings: prev?.pendingListings ?? 0,
            totalLeads: leadsData.pagination.total,
            convertedLeads: all.filter((l) => l.status === "converted").length,
          }));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const conversionRate =
    stats && stats.totalLeads > 0
      ? Math.round((stats.convertedLeads / stats.totalLeads) * 100)
      : 0;

  const STAT_CARDS = [
    {
      label: "Total Listings",
      value: stats?.totalListings ?? 0,
      icon: Building2,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
      href: "/vendor/listings",
    },
    {
      label: "Total Leads",
      value: stats?.totalLeads ?? 0,
      icon: MessageSquare,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
      href: "/vendor/leads",
    },
    {
      label: "Pending Review",
      value: stats?.pendingListings ?? 0,
      icon: Clock,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
      href: "/vendor/listings",
    },
    {
      label: "Conversion Rate",
      value: `${conversionRate}%`,
      icon: TrendingUp,
      color: "text-green-600 bg-green-50 dark:bg-green-900/20",
      href: "/vendor/leads",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {session?.user.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here&apos;s what&apos;s happening with your listings today.
          </p>
        </div>
        <Link href="/vendor/listings/new">
          <Button className="gap-2 hidden sm:flex">
            <Plus className="h-4 w-4" />
            Add Listing
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group border-border">
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                {loading ? (
                  <Skeleton className="h-7 w-16 mb-1" />
                ) : (
                  <div className="text-2xl font-bold text-foreground">{value}</div>
                )}
                <div className="text-xs text-muted-foreground">{label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Listings */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent Listings</CardTitle>
            <Link href="/vendor/listings" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : recentListings.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No listings yet</p>
                <Link href="/vendor/listings/new">
                  <Button size="sm" variant="outline" className="mt-3 gap-2">
                    <Plus className="h-3.5 w-3.5" /> Add your first listing
                  </Button>
                </Link>
              </div>
            ) : (
              recentListings.slice(0, 5).map((listing) => (
                <div key={listing._id} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-lg overflow-hidden shrink-0">
                    {listing.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={listing.images[0].url}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{listing.title}</p>
                    <p className="text-xs text-muted-foreground">{listing.priceRange?.min ? formatCurrency(listing.priceRange.min) : "—"}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xs capitalize shrink-0 ${getStatusColor(listing.status)}`}
                  >
                    {listing.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent Leads</CardTitle>
            <Link href="/vendor/leads" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : recentLeads.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No leads yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Leads will appear here when customers inquire
                </p>
              </div>
            ) : (
              recentLeads.slice(0, 5).map((lead) => (
                <div key={lead._id} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0 text-primary font-semibold text-xs">
                    {lead.customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{lead.customer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {lead.guestCount} guests · {formatDate(lead.eventDate)}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xs capitalize shrink-0 ${getStatusColor(lead.status)}`}
                  >
                    {lead.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Empty state CTA */}
      {!loading && recentListings.length === 0 && (
        <Card className="border-dashed border-2 border-border bg-muted/30">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">List Your First Property</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
              Start attracting event planners by adding your farmhouse or venue. It takes just a few minutes.
            </p>
            <Link href="/vendor/listings/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Listing
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
