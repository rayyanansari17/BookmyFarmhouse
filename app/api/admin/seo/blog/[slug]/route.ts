import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import Blog from "@/lib/db/models/Blog.model";
import SeoGscMetric from "@/lib/db/models/SeoGscMetric.model";
import SeoGa4Metric from "@/lib/db/models/SeoGa4Metric.model";
import SeoCwvMetric from "@/lib/db/models/SeoCwvMetric.model";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { slug } = await params;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [blog, gscSummary, topQueries, clicksTrend, ga4Summary, cwv] = await Promise.all([
    Blog.findOne({ slug }).lean(),

    SeoGscMetric.aggregate([
      { $match: { blogSlug: slug, date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: null,
          clicks: { $sum: "$clicks" },
          impressions: { $sum: "$impressions" },
          avgCtr: { $avg: "$ctr" },
          avgPosition: { $avg: "$position" },
        },
      },
    ]),

    SeoGscMetric.aggregate([
      { $match: { blogSlug: slug, date: { $gte: thirtyDaysAgo } } },
      { $group: { _id: "$query", clicks: { $sum: "$clicks" }, impressions: { $sum: "$impressions" }, avgPosition: { $avg: "$position" }, avgCtr: { $avg: "$ctr" } } },
      { $sort: { clicks: -1 } },
      { $limit: 20 },
    ]),

    SeoGscMetric.aggregate([
      { $match: { blogSlug: slug, date: { $gte: ninetyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          clicks: { $sum: "$clicks" },
          impressions: { $sum: "$impressions" },
          avgPosition: { $avg: "$position" },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    SeoGa4Metric.aggregate([
      { $match: { blogSlug: slug, date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: null,
          sessions: { $sum: "$sessions" },
          conversions: { $sum: "$conversions" },
          avgEngagementTime: { $avg: "$avgEngagementTimeSeconds" },
          avgBounceRate: { $avg: "$bounceRate" },
        },
      },
    ]),

    SeoCwvMetric.findOne({ blogSlug: slug }).sort({ checkedAt: -1 }).lean(),
  ]);

  if (!blog) {
    return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
  }

  const gsc = gscSummary[0] ?? { clicks: 0, impressions: 0, avgCtr: 0, avgPosition: 0 };
  const ga4 = ga4Summary[0] ?? { sessions: 0, conversions: 0, avgEngagementTime: 0, avgBounceRate: 0 };

  return NextResponse.json({
    success: true,
    data: {
      blog,
      gsc: {
        clicks: gsc.clicks,
        impressions: gsc.impressions,
        ctr: Math.round((gsc.avgCtr ?? 0) * 10000) / 100,
        avgPosition: Math.round((gsc.avgPosition ?? 0) * 10) / 10,
      },
      topQueries,
      clicksTrend,
      ga4: {
        sessions: ga4.sessions,
        conversions: ga4.conversions,
        avgEngagementTimeSec: Math.round(ga4.avgEngagementTime ?? 0),
        avgBounceRate: Math.round((ga4.avgBounceRate ?? 0) * 100),
      },
      cwv: cwv ?? null,
    },
  });
}
