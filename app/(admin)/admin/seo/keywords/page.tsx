"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KeywordRow {
  keyword: string;
  blogSlug: string;
  position: number;
  positionDelta7d: number | null;
  positionDelta30d: number | null;
  estimatedMonthlyTraffic: number;
  serpFeatures: string[];
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta == null) return <span className="text-muted-foreground text-xs">—</span>;
  if (delta === 0) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold ${delta < 0 ? "text-green-600" : "text-red-500"}`}>
      {delta < 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(delta)}
    </span>
  );
}

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/seo/keywords")
      .then((r) => r.json())
      .then((d) => { if (d.success) setKeywords(d.data); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Keyword Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-1">Rank tracking and keyword opportunity analysis</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Tracked Keywords</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : keywords.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground text-sm">No rank tracking data yet.</p>
              <p className="text-xs text-muted-foreground mt-2">
                Set up DataForSEO (Phase C) or sync GSC to start tracking keyword positions.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left pb-2 font-semibold">Keyword</th>
                    <th className="text-right pb-2 font-semibold">Position</th>
                    <th className="text-right pb-2 font-semibold">7d</th>
                    <th className="text-right pb-2 font-semibold">30d</th>
                    <th className="text-right pb-2 font-semibold">Est. Traffic/mo</th>
                    <th className="text-left pb-2 font-semibold pl-4">SERP Features</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((kw, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="py-2 font-medium text-foreground max-w-[200px] truncate">{kw.keyword}</td>
                      <td className="py-2 text-right font-semibold">{kw.position.toFixed(1)}</td>
                      <td className="py-2 text-right"><DeltaBadge delta={kw.positionDelta7d} /></td>
                      <td className="py-2 text-right"><DeltaBadge delta={kw.positionDelta30d} /></td>
                      <td className="py-2 text-right text-muted-foreground">{kw.estimatedMonthlyTraffic.toLocaleString()}</td>
                      <td className="py-2 pl-4 text-muted-foreground">{kw.serpFeatures.slice(0, 2).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
