"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, BarChart2, RefreshCw, Loader2, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface OverviewData {
  totalPublished: number;
  statusCounts: Record<string, number>;
  current30d: { clicks: number; impressions: number; ctr: number; avgPosition: number };
  prev30d: { clicks: number; impressions: number };
  clicksDelta: number | null;
  topPages: { _id: string; clicks: number; impressions: number }[];
  clicksTrend: { _id: string; clicks: number; impressions: number }[];
}

function MetricCard({
  label, value, sub, delta, icon: Icon, loading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  delta?: number | null;
  icon?: React.ElementType;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            {delta != null && (
              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${delta >= 0 ? "text-green-600" : "text-red-500"}`}>
                {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {delta >= 0 ? "+" : ""}{delta}% vs prev 30d
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function SeoDashboardPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/seo/overview");
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const triggerSync = async (type: string) => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/seo/trigger-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const json = await res.json();
      if (json.success) toast.success(`${type} job queued`);
      else toast.error(json.error ?? "Failed to queue job");
    } catch {
      toast.error("Failed to reach job service");
    } finally {
      setSyncing(false);
    }
  };

  const cur = data?.current30d;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SEO Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Organic performance across all published blogs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => triggerSync("sync-gsc")} disabled={syncing}>
            {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
            Sync GSC
          </Button>
          <Button variant="outline" size="sm" onClick={() => triggerSync("sync-ga4")} disabled={syncing}>
            Sync GA4
          </Button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Published Blogs" value={data?.totalPublished ?? 0} icon={Globe} loading={loading} />
        <MetricCard
          label="Clicks (30d)"
          value={(cur?.clicks ?? 0).toLocaleString()}
          delta={data?.clicksDelta}
          loading={loading}
        />
        <MetricCard
          label="Impressions (30d)"
          value={(cur?.impressions ?? 0).toLocaleString()}
          loading={loading}
        />
        <MetricCard
          label="Avg CTR"
          value={`${cur?.ctr ?? 0}%`}
          sub={`Avg position: ${cur?.avgPosition ?? "—"}`}
          loading={loading}
        />
      </div>

      {/* Status breakdown */}
      {data?.statusCounts && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Content Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {Object.entries(data.statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center gap-1.5 text-sm">
                <span className="font-semibold text-foreground">{count}</span>
                <span className="text-muted-foreground capitalize">{status.replace(/_/g, " ")}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Top pages */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart2 className="h-4 w-4" /> Top Pages by Clicks (30d)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : !data?.topPages.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No data yet — sync GSC to see performance data.
            </p>
          ) : (
            <div className="space-y-2">
              {data.topPages.map((page) => (
                <Link
                  key={page._id}
                  href={`/admin/seo/${page._id}`}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm font-mono text-muted-foreground truncate max-w-xs">{page._id}</span>
                  <div className="flex items-center gap-4 text-sm shrink-0">
                    <span className="font-semibold">{page.clicks.toLocaleString()} <span className="text-muted-foreground text-xs font-normal">clicks</span></span>
                    <span className="text-muted-foreground">{page.impressions.toLocaleString()} imp</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!data?.totalPublished && !loading && (
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-8 text-center">
            <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground mb-1">No published blogs yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create and publish your first blog to start tracking SEO performance.</p>
            <Link href="/admin/blog/new">
              <Button size="sm">Create First Blog</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
