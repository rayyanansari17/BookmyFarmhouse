import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import Blog from "@/lib/db/models/Blog.model";
import SeoGscMetric from "@/lib/db/models/SeoGscMetric.model";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    totalPublished,
    statusCounts,
    current30d,
    prev30d,
    topPages,
    clicksTrend,
  ] = await Promise.all([
    Blog.countDocuments({ status: "published" }),

    Blog.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),

    SeoGscMetric.aggregate([
      { $match: { date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: null,
          totalClicks: { $sum: "$clicks" },
          totalImpressions: { $sum: "$impressions" },
          avgCtr: { $avg: "$ctr" },
          avgPosition: { $avg: "$position" },
        },
      },
    ]),

    SeoGscMetric.aggregate([
      { $match: { date: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
      {
        $group: {
          _id: null,
          totalClicks: { $sum: "$clicks" },
          totalImpressions: { $sum: "$impressions" },
        },
      },
    ]),

    SeoGscMetric.aggregate([
      { $match: { date: { $gte: thirtyDaysAgo } } },
      { $group: { _id: "$blogSlug", clicks: { $sum: "$clicks" }, impressions: { $sum: "$impressions" } } },
      { $sort: { clicks: -1 } },
      { $limit: 10 },
    ]),

    // 90-day daily clicks + impressions trend
    SeoGscMetric.aggregate([
      { $match: { date: { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          clicks: { $sum: "$clicks" },
          impressions: { $sum: "$impressions" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const cur = current30d[0] ?? { totalClicks: 0, totalImpressions: 0, avgCtr: 0, avgPosition: 0 };
  const prev = prev30d[0] ?? { totalClicks: 0, totalImpressions: 0 };

  const statusMap = Object.fromEntries(statusCounts.map((s: { _id: string; count: number }) => [s._id, s.count]));

  return NextResponse.json({
    success: true,
    data: {
      totalPublished,
      statusCounts: statusMap,
      current30d: {
        clicks: cur.totalClicks,
        impressions: cur.totalImpressions,
        ctr: Math.round((cur.avgCtr ?? 0) * 10000) / 100,
        avgPosition: Math.round((cur.avgPosition ?? 0) * 10) / 10,
      },
      prev30d: {
        clicks: prev.totalClicks,
        impressions: prev.totalImpressions,
      },
      clicksDelta: prev.totalClicks > 0
        ? Math.round(((cur.totalClicks - prev.totalClicks) / prev.totalClicks) * 100)
        : null,
      topPages,
      clicksTrend,
    },
  });
}
