import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import Groq from "groq-sdk";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "vendor") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: "AI service not configured" }, { status: 503 });
  }

  const { title, city, state, amenities = [], eventTypes = [] } = await req.json();

  if (!title?.trim()) {
    return NextResponse.json({ success: false, error: "Property title is required" }, { status: 400 });
  }

  const location = [city, state].filter(Boolean).join(", ");
  const amenityList = amenities.length > 0 ? amenities.join(", ") : null;
  const eventList = eventTypes.length > 0 ? eventTypes.join(", ") : null;

  const prompt = `Write a compelling 150-200 word property description for an Indian farmhouse venue listing.

Property details:
- Name: ${title}
${location ? `- Location: ${location}` : ""}
${amenityList ? `- Amenities available: ${amenityList}` : ""}
${eventList ? `- Ideal for: ${eventList}` : ""}

Instructions:
- Naturally weave in SEO-friendly keywords (farmhouse venue, event space, ${city || "India"} farmhouse, booking, etc.)
- Describe the atmosphere — peaceful, scenic, nature-filled
- Mention key amenities naturally in context
- Use a warm, inviting, professional tone
- Write 150-200 words in 2-3 short paragraphs
- Plain text only — no bullet points, no markdown, no headers
- Do NOT start with "Welcome to" or the property name
- Make it unique and compelling for potential customers`;

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.75,
    });

    const description = completion.choices[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ success: true, description });
  } catch (err) {
    console.error("Groq error:", err);
    return NextResponse.json({ success: false, error: "Failed to generate description" }, { status: 500 });
  }
}
