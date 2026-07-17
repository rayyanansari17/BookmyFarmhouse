import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

export const maxDuration = 60; // Groq generation can take 20-40s
import { connectDB } from "@/lib/db/mongoose";
import Blog from "@/lib/db/models/Blog.model";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function scoreKeywordDensity(text: string, keyword: string): number {
  if (!text || !keyword) return 0;
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const kwWords = keyword.toLowerCase().split(/\s+/);
  let count = 0;
  for (let i = 0; i <= words.length - kwWords.length; i++) {
    if (kwWords.every((w, j) => words[i + j] === w)) count++;
  }
  return words.length > 0 ? (count / words.length) * 100 : 0;
}

function countWords(html: string): number {
  return html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
}

function calcSeoScore(data: {
  keywordDensity: number;
  wordCount: number;
  hasFaq: boolean;
  metaTitleLen: number;
  metaDescLen: number;
  internalLinksCount: number;
  hasGeoBlock: boolean;
}): number {
  let score = 0;
  if (data.keywordDensity >= 1.0 && data.keywordDensity <= 3.0) score += 20;
  else if (data.keywordDensity > 0) score += 10;
  if (data.wordCount >= 800) score += 20;
  if (data.wordCount >= 1200) score += 10;
  if (data.hasFaq) score += 15;
  if (data.metaTitleLen > 0 && data.metaTitleLen <= 60) score += 10;
  if (data.metaDescLen > 0 && data.metaDescLen <= 160) score += 10;
  if (data.internalLinksCount >= 2) score += 10;
  if (data.hasGeoBlock) score += 5;
  return Math.min(100, score);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;
  const blog = await Blog.findById(id);
  if (!blog) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  // Fetch existing published blogs for internal link suggestions
  const publishedBlogs = await Blog.find({ status: "published" })
    .select("slug title targetKeyword")
    .limit(20)
    .lean();

  const internalLinkTargets = publishedBlogs
    .map((b) => `- "${b.title}" → /blog/${b.slug}`)
    .join("\n") || "No published blogs yet — omit internal links";

  const contentTypeInstructions: Record<string, string> = {
    "location-page": "Focus on specific location details, local landmarks, nearby areas, and venue features. Target length: 1200–1800 words.",
    "comparison": "Compare multiple venue options with pros/cons. Target length: 1500–2500 words.",
    "how-to": "Step-by-step guide format with numbered steps. Target length: 1000–1500 words.",
    "faq-cluster": "Answer-focused, question-and-answer format throughout. Target length: 600–900 words.",
    "geo-summary": "Concise, factual, structured as a direct answer for AI engines. Target length: 300–500 words.",
  };

  const typeInstruction = contentTypeInstructions[blog.contentType] || contentTypeInstructions["location-page"];

  const systemPrompt = `You are an expert SEO content writer for BookMyFarmhouse (BMF), a venue discovery and booking platform for farmhouses, private villas, and event venues in Hyderabad and Telangana, India.

Your audience: young adults, families, event planners, and corporate teams looking to book private venues for parties, staycations, corporate offsites, and celebrations.

Tone: friendly, helpful, locally relevant. Use Indian English. Reference local areas, landmarks, and occasions naturally.

Always write with SEO intent: natural keyword placement, scannable H2 structure, answer real questions, include a strong CTA to browse or book on BMF.`;

  const userPrompt = `Write a complete SEO blog post with this brief:

PRIMARY KEYWORD: ${blog.targetKeyword}
SECONDARY KEYWORDS: ${blog.secondaryKeywords.join(", ") || "none specified"}
CONTENT TYPE: ${blog.contentType}
INSTRUCTIONS: ${typeInstruction}
PERSONA: families, party planners, corporate event teams in Hyderabad

INTERNAL PAGES TO LINK TO:
${internalLinkTargets}

OUTPUT FORMAT — JSON only, no markdown wrapper, no explanation outside the JSON:
{
  "title": "compelling title, keyword near start, under 65 chars",
  "metaTitle": "under 60 chars, includes BookMyFarmhouse brand",
  "metaDescription": "under 160 chars, includes CTA like 'Browse now'",
  "h1": "exact H1 tag text",
  "bodyHtml": "full blog HTML using <h2>, <p>, <ul>, <ol>, <strong> tags — NO <html>/<body>/<head> wrapper",
  "faqSchema": [
    { "question": "...", "answer": "..." }
  ],
  "geoAnswerBlock": "2-3 paragraphs of PLAIN TEXT (no HTML tags) — a direct answer to the primary question for AI engine extraction",
  "internalLinks": [
    { "anchor": "...", "targetSlug": "blog/slug-here" }
  ],
  "secondaryKeywords": ["kw1", "kw2", "kw3"]
}

Rules:
- Primary keyword must appear in title, H1, first 100 words, and at least one H2
- Minimum 4 FAQ pairs, maximum 8
- Minimum 2 internal links if published blogs exist
- End the blog with a clear CTA paragraph to browse BookMyFarmhouse
- Body must be full HTML, ready to render — no placeholder text`;

  let completion;
  try {
    completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: `Groq error: ${msg}` }, { status: 502 });
  }

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ success: false, error: "Generation failed — model returned no JSON", raw }, { status: 500 });
  }

  let generated: Record<string, unknown>;
  try {
    generated = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json({ success: false, error: "JSON parse error in generated content", raw }, { status: 500 });
  }

  const bodyHtml = (generated.bodyHtml as string) ?? "";
  const plainText = bodyHtml.replace(/<[^>]+>/g, " ");
  const wordCount = countWords(bodyHtml);
  const keywordDensity = scoreKeywordDensity(plainText, blog.targetKeyword);
  const faqSchema = (generated.faqSchema as { question: string; answer: string }[]) ?? [];
  const metaTitle = (generated.metaTitle as string) ?? "";
  const metaDescription = (generated.metaDescription as string) ?? "";
  const internalLinks = (generated.internalLinks as { anchor: string; targetSlug: string }[]) ?? [];
  const geoAnswerBlock = (generated.geoAnswerBlock as string) ?? "";

  const seoScore = calcSeoScore({
    keywordDensity,
    wordCount,
    hasFaq: faqSchema.length >= 4,
    metaTitleLen: metaTitle.length,
    metaDescLen: metaDescription.length,
    internalLinksCount: internalLinks.length,
    hasGeoBlock: geoAnswerBlock.length > 50,
  });

  const updated = await Blog.findByIdAndUpdate(
    id,
    {
      $set: {
        title: generated.title ?? blog.title,
        metaTitle,
        metaDescription,
        h1: generated.h1 ?? "",
        bodyHtml,
        faqSchema,
        geoAnswerBlock,
        internalLinks,
        secondaryKeywords: (generated.secondaryKeywords as string[]) ?? blog.secondaryKeywords,
        wordCount,
        keywordDensity: Math.round(keywordDensity * 100) / 100,
        seoScore,
        status: "pending_review",
        generatedBy: "groq/llama-3.3-70b-versatile",
        schemaTypes: ["Article", ...(faqSchema.length >= 4 ? ["FAQPage"] : [])],
      },
    },
    { new: true }
  ).lean();

  return NextResponse.json({ success: true, data: updated });
}
