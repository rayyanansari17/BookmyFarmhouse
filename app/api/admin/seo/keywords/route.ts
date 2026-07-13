import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import KeywordRankHistory from "@/lib/db/models/KeywordRankHistory.model";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();

    // Get latest rank snapshot per keyword
    const keywords = await KeywordRankHistory.aggregate([
      { $sort: { checkedAt: -1 } },
      {
        $group: {
          _id: "$keyword",
          blogSlug: { $first: "$blogSlug" },
          position: { $first: "$position" },
          positionDelta7d: { $first: "$positionDelta7d" },
          positionDelta30d: { $first: "$positionDelta30d" },
          estimatedMonthlyTraffic: { $first: "$estimatedMonthlyTraffic" },
          serpFeatures: { $first: "$serpFeatures" },
        },
      },
      { $sort: { position: 1 } },
      { $limit: 100 },
    ]);

    return NextResponse.json({
      success: true,
      data: keywords.map((k) => ({
        keyword: k._id,
        blogSlug: k.blogSlug,
        position: k.position ?? 0,
        positionDelta7d: k.positionDelta7d ?? null,
        positionDelta30d: k.positionDelta30d ?? null,
        estimatedMonthlyTraffic: k.estimatedMonthlyTraffic ?? 0,
        serpFeatures: k.serpFeatures ?? [],
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch keywords", details: String(err) }, { status: 500 });
  }
}
