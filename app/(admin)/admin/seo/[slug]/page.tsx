"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface BlogMetrics {
  blog: {
    title: string; slug: string; targetKeyword: string; status: string;
    seoScore: number; wordCount: number; publishedAt?: string; contentType: string;
  };
  gsc: { clicks: number; impressions: number; ctr: number; avgPosition: number };
  topQueries: { _id: string; clicks: number; impressions: number; avgPosition: number; avgCtr: number }[];
  ga4: { sessions: number; conversions: number; avgEngagementTimeSec: number; avgBounceRate: number };
  cwv: {
    lcpMs: number; inpMs: number; clsScore: number;
    lcpStatus: string; inpStatus: string; clsStatus: string; overallStatus: string;
  } | null;
}

const CWV_STATUS_COLOR: Record<string, string> = {
  good: "text-green-600 bg-green-50",
  "needs-improvement": "text-yellow-600 bg-yellow-50",
  poor: "text-red-600 bg-red-50",
};

export default function BlogAnalyticsPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [data, setData] = useState<BlogMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/admin/seo/blog/${slug}`);
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }, [slug]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="space-y-4 max-w-3xl">
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
    </div>
  );

  if (!data) return <p className="text-muted-foreground">Blog not found.</p>;

  const { blog, gsc, topQueries, ga4, cwv } = data;

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/seo")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-lg truncate">{blog.title}</h1>
          <p className="text-xs text-muted-foreground">/blog/{blog.slug} · {blog.targetKeyword}</p>
        </div>
        <a href={`/blog/${blog.slug}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm"><ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View</Button>
        </a>
      </div>

      {/* GSC metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Clicks (30d)", value: gsc.clicks.toLocaleString() },
          { label: "Impressions", value: gsc.impressions.toLocaleString() },
          { label: "CTR", value: `${gsc.ctr}%` },
          { label: "Avg Position", value: gsc.avgPosition || "—" },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold text-foreground">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* GA4 metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Sessions (30d)", value: ga4.sessions.toLocaleString() },
          { label: "Conversions", value: ga4.conversions },
          { label: "Avg Engagement", value: `${ga4.avgEngagementTimeSec}s` },
          { label: "Bounce Rate", value: `${ga4.avgBounceRate}%` },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold text-foreground">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CWV */}
      {cwv && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Core Web Vitals</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 flex-wrap">
            {[
              { label: "LCP", value: `${cwv.lcpMs}ms`, status: cwv.lcpStatus },
              { label: "INP", value: `${cwv.inpMs}ms`, status: cwv.inpStatus },
              { label: "CLS", value: cwv.clsScore.toFixed(3), status: cwv.clsStatus },
            ].map(({ label, value, status }) => (
              <div key={label} className={`rounded-lg px-4 py-2.5 ${CWV_STATUS_COLOR[status] ?? "bg-gray-50"}`}>
                <p className="text-xs font-semibold">{label}</p>
                <p className="text-lg font-bold">{value}</p>
                <p className="text-xs capitalize">{status.replace("-", " ")}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Top queries */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Top Queries (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          {topQueries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No query data yet — sync GSC first.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left pb-2 font-semibold text-muted-foreground">Query</th>
                    <th className="text-right pb-2 font-semibold text-muted-foreground">Clicks</th>
                    <th className="text-right pb-2 font-semibold text-muted-foreground">Impr</th>
                    <th className="text-right pb-2 font-semibold text-muted-foreground">CTR</th>
                    <th className="text-right pb-2 font-semibold text-muted-foreground">Pos</th>
                  </tr>
                </thead>
                <tbody>
                  {topQueries.map((q) => (
                    <tr key={q._id} className="border-b border-border/50 last:border-0">
                      <td className="py-2 text-foreground max-w-[200px] truncate">{q._id}</td>
                      <td className="py-2 text-right font-semibold">{q.clicks}</td>
                      <td className="py-2 text-right text-muted-foreground">{q.impressions}</td>
                      <td className="py-2 text-right text-muted-foreground">{(q.avgCtr * 100).toFixed(1)}%</td>
                      <td className="py-2 text-right text-muted-foreground">{q.avgPosition.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blog health */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Content Health</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm">
          <div><span className="text-muted-foreground">SEO Score </span><span className="font-semibold">{blog.seoScore}/100</span></div>
          <div><span className="text-muted-foreground">Words </span><span className="font-semibold">{blog.wordCount.toLocaleString()}</span></div>
          <div><span className="text-muted-foreground">Type </span><span className="font-semibold capitalize">{blog.contentType.replace("-", " ")}</span></div>
          {blog.publishedAt && (
            <div><span className="text-muted-foreground">Published </span><span className="font-semibold">{new Date(blog.publishedAt).toLocaleDateString("en-IN")}</span></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
