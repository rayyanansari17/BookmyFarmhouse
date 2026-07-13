/**
 * sync-ga4.ts — Pull GA4 engagement data into SeoGa4Metric collection.
 *
 * REQUIRED ENV VARS ON RAILWAY:
 *   GOOGLE_SERVICE_ACCOUNT_JSON  — same base64 key as GSC (Viewer role on GA4 property)
 *   GA4_PROPERTY_ID              — e.g. "properties/123456789" (GA4 Admin → Property Settings)
 *   MONGODB_URI
 */

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { connectDB } from "../db";
import mongoose from "mongoose";

const SeoGa4MetricSchema = new mongoose.Schema({
  blogSlug: String,
  date: Date,
  sessions: Number,
  engagedSessions: Number,
  engagementRate: Number,
  avgEngagementTimeSeconds: Number,
  bounceRate: Number,
  newUsers: Number,
  returningUsers: Number,
  conversions: Number,
  deviceCategory: String,
  syncedAt: Date,
});
SeoGa4MetricSchema.index({ blogSlug: 1, date: 1, deviceCategory: 1 }, { unique: true });
const SeoGa4Metric = mongoose.models.SeoGa4Metric ?? mongoose.model("SeoGa4Metric", SeoGa4MetricSchema);

function getGa4Client() {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!b64) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON env var missing");
  const credentials = JSON.parse(Buffer.from(b64, "base64").toString());
  return new BetaAnalyticsDataClient({ credentials });
}

export async function syncGa4() {
  await connectDB();
  const client = getGa4Client();
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) throw new Error("GA4_PROPERTY_ID env var missing");

  const [response] = await client.runReport({
    property: propertyId,
    dateRanges: [{ startDate: "90daysAgo", endDate: "today" }],
    dimensions: [{ name: "pagePath" }, { name: "deviceCategory" }, { name: "date" }],
    metrics: [
      { name: "sessions" }, { name: "engagedSessions" }, { name: "engagementRate" },
      { name: "averageSessionDuration" }, { name: "bounceRate" }, { name: "newUsers" },
      { name: "returningUsers" }, { name: "conversions" },
    ],
    dimensionFilter: {
      filter: {
        fieldName: "pagePath",
        stringFilter: { matchType: "BEGINS_WITH", value: "/blog/" },
      },
    },
    limit: 5000,
  });

  let upserted = 0;
  for (const row of response.rows ?? []) {
    const [pagePath, deviceCategory, dateStr] = row.dimensionValues?.map((d) => d.value ?? "") ?? [];
    const blogMatch = pagePath?.match(/\/blog\/([^/?#]+)/);
    if (!blogMatch || !dateStr) continue;
    const blogSlug = blogMatch[1];
    const [sessions, engagedSessions, engagementRate, avgEngSec, bounceRate, newUsers, returningUsers, conversions] =
      row.metricValues?.map((m) => parseFloat(m.value ?? "0")) ?? [];

    await SeoGa4Metric.updateOne(
      { blogSlug, date: new Date(`${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`), deviceCategory: deviceCategory ?? "desktop" },
      {
        $set: {
          sessions: sessions ?? 0,
          engagedSessions: engagedSessions ?? 0,
          engagementRate: engagementRate ?? 0,
          avgEngagementTimeSeconds: Math.round(avgEngSec ?? 0),
          bounceRate: bounceRate ?? 0,
          newUsers: newUsers ?? 0,
          returningUsers: returningUsers ?? 0,
          conversions: conversions ?? 0,
          syncedAt: new Date(),
        },
      },
      { upsert: true }
    );
    upserted++;
  }

  console.log(`GA4 sync complete — ${upserted} rows upserted`);
}
