/**
 * sync-gsc.ts — Pull Search Console data into SeoGscMetric collection.
 *
 * GOOGLE CLOUD SETUP (one-time, before this job can run):
 * ─────────────────────────────────────────────────────────
 * 1. Go to https://console.cloud.google.com → New project → "bmf-seo"
 * 2. Enable APIs: Google Search Console API, Google Analytics Data API
 * 3. IAM & Admin → Service Accounts → Create → download JSON key as service-account.json
 * 4. Search Console (https://search.google.com/search-console) →
 *      Settings → Users & Permissions → Add → paste service account email → Read permission
 * 5. GA4 (https://analytics.google.com) →
 *      Admin → Account Access Management → Add → paste email → Viewer
 * 6. Base64-encode the key for Railway env var:
 *      base64 -i service-account.json | tr -d '\n'
 *    Copy the output → Railway → Variables → GOOGLE_SERVICE_ACCOUNT_JSON
 *
 * REQUIRED ENV VARS ON RAILWAY:
 *   GOOGLE_SERVICE_ACCOUNT_JSON  — base64-encoded service account JSON key
 *   GSC_SITE_URL                 — e.g. "https://bookmyfarmhouse.app/"
 *   MONGODB_URI
 */

import { google } from "googleapis";
import { connectDB } from "../db";
import mongoose from "mongoose";

const SeoGscMetricSchema = new mongoose.Schema({
  blogSlug: String,
  date: Date,
  query: String,
  clicks: Number,
  impressions: Number,
  ctr: Number,
  position: Number,
  device: String,
  country: String,
  syncedAt: Date,
});
SeoGscMetricSchema.index({ blogSlug: 1, date: 1, query: 1, device: 1 }, { unique: true });
const SeoGscMetric = mongoose.models.SeoGscMetric ?? mongoose.model("SeoGscMetric", SeoGscMetricSchema);

function getGscAuth() {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!b64) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON env var missing");
  const key = JSON.parse(Buffer.from(b64, "base64").toString());
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
}

export async function syncGsc() {
  await connectDB();
  const auth = getGscAuth();
  const sc = google.searchconsole({ version: "v1", auth });

  const siteUrl = process.env.GSC_SITE_URL ?? "https://bookmyfarmhouse.app/";
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 90);

  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const res = await sc.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: fmt(startDate),
      endDate: fmt(endDate),
      dimensions: ["page", "query", "date", "device"],
      rowLimit: 5000,
    },
  });

  const rows = res.data.rows ?? [];
  let upserted = 0;

  for (const row of rows) {
    const [page, query, dateStr, device] = row.keys ?? [];
    if (!page || !query || !dateStr) continue;

    // Extract blog slug from URL  e.g. /blog/farmhouses-near-hyderabad → farmhouses-near-hyderabad
    const blogMatch = page.match(/\/blog\/([^/?#]+)/);
    if (!blogMatch) continue;
    const blogSlug = blogMatch[1];

    await SeoGscMetric.updateOne(
      { blogSlug, date: new Date(dateStr), query, device: device ?? "DESKTOP" },
      {
        $set: {
          clicks: row.clicks ?? 0,
          impressions: row.impressions ?? 0,
          ctr: row.ctr ?? 0,
          position: row.position ?? 0,
          country: "IND",
          syncedAt: new Date(),
        },
      },
      { upsert: true }
    );
    upserted++;
  }

  console.log(`GSC sync complete — ${upserted} rows upserted`);
}
