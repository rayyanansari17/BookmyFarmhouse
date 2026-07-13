import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import Blog from "@/lib/db/models/Blog.model";
import SeoGscMetric from "@/lib/db/models/SeoGscMetric.model";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const { keywords, contentType } = await req.json() as {
    keywords: string[];
    contentType?: string;
  };

  if (!keywords?.length) {
    return NextResponse.json({ success: false, error: "keywords array required" }, { status: 400 });
  }

  // Check which keywords already have blog coverage
  const existingBlogs = await Blog.find({}).select("targetKeyword slug").lean();
  const coveredKeywords = new Set(existingBlogs.map((b) => b.targetKeyword.toLowerCase()));

  // Pull GSC impressions data for these keywords (if any)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const gscData = await SeoGscMetric.aggregate([
    { $match: { query: { $in: keywords }, date: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: "$query",
        totalImpressions: { $sum: "$impressions" },
        totalClicks: { $sum: "$clicks" },
        avgPosition: { $avg: "$position" },
      },
    },
  ]);

  const gscMap = new Map(gscData.map((d) => [d._id, d]));

  // Build context for the AI agent
  const keywordContext = keywords.map((kw) => {
    const gsc = gscMap.get(kw);
    const covered = coveredKeywords.has(kw.toLowerCase());
    return {
      keyword: kw,
      alreadyCovered: covered,
      gscImpressions: gsc?.totalImpressions ?? 0,
      gscClicks: gsc?.totalClicks ?? 0,
      gscAvgPosition: gsc?.avgPosition ? Math.round(gsc.avgPosition) : null,
    };
  });

  const prompt = `You are an SEO strategist for BookMyFarmhouse, a farmhouse venue discovery platform in Hyderabad and Telangana, India.

Analyze these keyword candidates and pick the SINGLE BEST keyword to write a blog post about right now.

KEYWORD CANDIDATES:
${JSON.stringify(keywordContext, null, 2)}

CONTENT TYPE REQUESTED: ${contentType || "any"}

SCORING CRITERIA (reason through each):
1. NOT already covered by an existing blog (disqualify if alreadyCovered=true)
2. Has search demand (GSC impressions OR is a high-intent local query for Hyderabad farmhouses)
3. Has transactional/local intent (e.g. "book farmhouse hyderabad", "birthday venues near me") over purely informational
4. Has room to rank (lower competition expected for hyper-local queries)
5. Aligns with BMF's niche: farmhouses, private venues, event spaces in Hyderabad/Telangana

Reason through all candidates, then output JSON only (no markdown):
{
  "chosenKeyword": "the exact keyword string",
  "reasoning": "2-3 sentence explanation of why this keyword wins",
  "estimatedDifficulty": "low|medium|high",
  "intent": "transactional|local|informational|navigational",
  "contentType": "location-page|comparison|how-to|faq-cluster|geo-summary"
}`;

  const completion = await groq.chat.completions.create({
    model: "deepseek-r1-distill-llama-70b",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 1024,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  // Strip <think>...</think> blocks that deepseek-r1 emits
  const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    return NextResponse.json({ success: false, error: "AI failed to return valid JSON" }, { status: 500 });
  }

  const result = JSON.parse(jsonMatch[0]);
  return NextResponse.json({ success: true, data: result });
}
