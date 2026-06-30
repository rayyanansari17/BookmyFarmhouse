"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, MessageSquare, Users, TrendingUp } from "lucide-react";

const COLORS = ["#ff914d", "#f97316", "#fb923c", "#fdba74"];

function StatCard({ label, value, icon: Icon, sub, loading }: {
  label: string; value: number | string; icon: React.ElementType; sub?: string; loading: boolean;
}) {
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{label}</span>
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        {loading ? <Skeleton className="h-8 w-20 mb-1" /> : (
          <div className="text-3xl font-bold text-foreground">{value}</div>
        )}
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

interface AnalyticsData {
  stats: { totalListings: number; pendingListings: number; totalLeads: number; totalVendors: number };
  listingsByStatus: { name: string; value: number }[];
  leadsByStatus: { name: string; value: number }[];
  monthlyListings: { month: string; listings: number; leads: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [propRes, leadsRes, usersRes] = await Promise.all([
          fetch("/api/admin/properties?limit=200"),
          fetch("/api/admin/inquiries?limit=200"),
          fetch("/api/admin/users?limit=1"),
        ]);
        const [propData, leadsData, usersData] = await Promise.all([
          propRes.json(), leadsRes.json(), usersRes.json(),
        ]);

        const props = propData.success ? propData.data : [];
        const leads = leadsData.success ? leadsData.data : [];

        const statusCount = (arr: { status: string }[], statuses: string[]) =>
          statuses.map((s) => ({ name: s.charAt(0).toUpperCase() + s.slice(1), value: arr.filter((i) => i.status === s).length }));

        const monthlyMap: Record<string, { listings: number; leads: number }> = {};
        const addToMonthly = (items: { createdAt: string }[], key: "listings" | "leads") => {
          items.forEach((item) => {
            const d = new Date(item.createdAt);
            const month = d.toLocaleString("default", { month: "short", year: "2-digit" });
            if (!monthlyMap[month]) monthlyMap[month] = { listings: 0, leads: 0 };
            monthlyMap[month][key]++;
          });
        };
        addToMonthly(props, "listings");
        addToMonthly(leads, "leads");

        const monthlyListings = Object.entries(monthlyMap)
          .sort((a, b) => new Date("01 " + a[0]).getTime() - new Date("01 " + b[0]).getTime())
          .slice(-6)
          .map(([month, v]) => ({ month, ...v }));

        setData({
          stats: {
            totalListings: propData.success ? propData.pagination.total : 0,
            pendingListings: props.filter((p: { status: string }) => p.status === "pending").length,
            totalLeads: leadsData.success ? leadsData.pagination.total : 0,
            totalVendors: usersData.success ? usersData.pagination.total : 0,
          },
          listingsByStatus: statusCount(props, ["pending", "approved", "rejected"]),
          leadsByStatus: statusCount(leads, ["new", "contacted", "booked", "closed"]),
          monthlyListings,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Platform performance at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Listings" value={data?.stats.totalListings ?? 0} icon={Building2} loading={loading} />
        <StatCard label="Pending Review" value={data?.stats.pendingListings ?? 0} icon={TrendingUp} loading={loading} />
        <StatCard label="Total Leads" value={data?.stats.totalLeads ?? 0} icon={MessageSquare} loading={loading} />
        <StatCard label="Total Vendors" value={data?.stats.totalVendors ?? 0} icon={Users} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly trend */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Monthly Activity (Last 6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48 w-full" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data?.monthlyListings ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="listings" fill="#ff914d" radius={[4, 4, 0, 0]} name="Listings" />
                  <Bar dataKey="leads" fill="#fdba74" radius={[4, 4, 0, 0]} name="Leads" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Lead funnel */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Lead Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48 w-full" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data?.leadsByStatus ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={60} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="value" fill="#ff914d" radius={[0, 4, 4, 0]} name="Leads" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Listings by status pie */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Listings by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48 w-full" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data?.listingsByStatus ?? []} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {data?.listingsByStatus.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Lead trend line */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Lead Growth Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48 w-full" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data?.monthlyListings ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                  <Line type="monotone" dataKey="leads" stroke="#ff914d" strokeWidth={2} dot={{ r: 4, fill: "#ff914d" }} name="Leads" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
