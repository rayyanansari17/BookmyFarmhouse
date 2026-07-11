/**
 * scripts/scrape-google-maps.ts
 *
 * Scrapes real venue data + photos from Google Maps.
 * Strategy: collect all place links from the search feed, then navigate
 * to each place's own page to extract name, address, phone and photo.
 *
 * Setup:
 *   npm install -D playwright tsx
 *   npx playwright install chromium
 *
 * Usage:
 *   npx tsx scripts/scrape-google-maps.ts --city hyderabad
 *   npx tsx scripts/scrape-google-maps.ts --city mumbai --keyword "resort" --limit 30
 */

import { chromium, Page } from "playwright";
import * as fs from "fs";
import * as path from "path";

// ── CLI args ──────────────────────────────────────────────────────────────────
const rawArgs = process.argv.slice(2);
const args: Record<string, string> = {};
for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i].startsWith("--")) {
    const key = rawArgs[i].slice(2);
    const val = rawArgs[i + 1] && !rawArgs[i + 1].startsWith("--") ? rawArgs[++i] : "true";
    args[key] = val;
  }
}

const CITY = args.city;
const AREA = args.area;           // specific locality/area within the city
const KEYWORD = args.keyword ?? "farmhouse";
const LIMIT = parseInt(args.limit ?? "20", 10);
const PUSH = args.push === "true";

// Search uses the area if given, otherwise the city
const SEARCH_LOCATION = AREA ?? CITY;

if (!CITY) {
  console.error("Error: --city is required");
  console.error("Usage: npx tsx scripts/scrape-google-maps.ts --city hyderabad");
  console.error("       npx tsx scripts/scrape-google-maps.ts --city hyderabad --area moinabad");
  process.exit(1);
}

interface VenueResult {
  placeId: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  website?: string;
  rating?: number;
  photoUrl?: string;
  types: string[];
}

function upgradePhotoUrl(src: string): string {
  return src
    .replace(/=w\d+-h\d+[^"']*/g, "=w1200-h800-k-no")
    .replace(/=s\d+[^"']*/g, "=w1200-h800-k-no");
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Extract from place detail page ───────────────────────────────────────────
async function extractPlacePage(page: Page): Promise<Partial<VenueResult>> {
  await delay(1800);

  // Name — try several selectors in order
  const nameSelectors = [
    'h1.DUwDvf',
    'h1[class*="DUwDvf"]',
    'h1[class*="fontDisplay"]',
    'h1[class*="tAiQdd"]',
    '[data-attrid="title"] h1',
    'h1',
  ];
  let name = "";
  for (const sel of nameSelectors) {
    name = await page.$eval(sel, (el) => el.textContent?.trim() ?? "").catch(() => "");
    if (name && name !== "Google Maps" && name.length > 1) break;
  }

  // Address — try multiple selectors; Google Maps shows the full formatted address
  let address = "";
  const addrSelectors = [
    '[data-item-id="address"] .Io6YTe',
    'button[data-item-id="address"] .Io6YTe',
    '[data-tooltip="Copy address"] .Io6YTe',
    '[aria-label*="Address:"] .Io6YTe',
    '[aria-label*="address"] .Io6YTe',
    // Fallback: grab all .Io6YTe elements and pick the one that looks like an address
  ];
  for (const sel of addrSelectors) {
    address = await page.$eval(sel, (el) => el.textContent?.trim() ?? "").catch(() => "");
    if (address && address.length > 3) break;
  }
  // Last resort: find any span that contains a house/street number pattern
  if (!address) {
    const candidates = await page.$$eval('.Io6YTe', (els) =>
      els.map((el) => el.textContent?.trim() ?? "").filter((t) => /\d/.test(t) && t.length > 5)
    ).catch(() => [] as string[]);
    address = candidates[0] ?? "";
  }

  // Phone
  const phone = await page.$eval(
    '[data-item-id*="phone"] .Io6YTe, [aria-label*="hone"] span.Io6YTe',
    (el) => el.textContent?.trim() ?? ""
  ).catch(() => "");

  // Rating
  const ratingText = await page.$eval(
    'span.ceNzKf[aria-hidden="true"], [class*="fontDisplayLarge"]:not([class*="subtitle"])',
    (el) => el.textContent?.trim() ?? ""
  ).catch(() => "");
  const rating = ratingText ? parseFloat(ratingText) : undefined;

  // Best photo: prefer the large featured image in the header, fall back to first thumbnail
  const photoSelectors = [
    'img[src*="googleusercontent.com"][class*="Liguzb"]',
    'img[src*="googleusercontent.com"][class*="hero"]',
    'img[src*="googleusercontent.com"][width="408"]',
    'img[src*="googleusercontent.com"][width="612"]',
    'button[aria-label*="Photo"] img[src*="googleusercontent.com"]',
    'img[src*="googleusercontent.com"]',
  ];
  let photoUrl = "";
  for (const sel of photoSelectors) {
    const src = await page.$eval(
      sel,
      (el) => (el as HTMLImageElement).src
    ).catch(() => "");
    if (src && src.includes("googleusercontent.com") && !src.includes("=s40") && !src.includes("=s16")) {
      photoUrl = upgradePhotoUrl(src);
      break;
    }
  }

  return {
    name,
    address: address || undefined,
    phone: phone || undefined,
    rating: rating && !isNaN(rating) ? rating : undefined,
    photoUrl: photoUrl || undefined,
  };
}

// ── Main scraper ──────────────────────────────────────────────────────────────
async function scrapeGoogleMaps(): Promise<VenueResult[]> {
  const searchQuery = `${KEYWORD} in ${SEARCH_LOCATION}`;
  const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;

  console.log("Launching Chromium...");
  const browser = await chromium.launch({ headless: false, slowMo: 20 });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 768 },
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
  });

  const page = await context.newPage();
  const results: VenueResult[] = [];
  const seen = new Set<string>();

  try {
    console.log(`Searching: "${searchQuery}"...`);
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await delay(2500);

    // Accept cookie banner if present
    for (const label of ["Accept all", "Accept All", "I agree"]) {
      const btn = page.getByRole("button", { name: new RegExp(`^${label}$`, "i") });
      if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await btn.click();
        await delay(1200);
        break;
      }
    }

    // Wait for results feed
    const hasFeed = await page.waitForSelector('[role="feed"]', { timeout: 18000 })
      .then(() => true).catch(() => false);

    if (!hasFeed) {
      console.log("\n⚠  Results feed not found — the browser may show a CAPTCHA.");
      console.log("   Solve it in the browser window, then press Enter here.");
      await new Promise<void>((r) => process.stdin.once("data", () => r()));
      await delay(2000);
    }

    // Scroll to load more results
    console.log("Scrolling to load all results...");
    for (let i = 0; i < 5; i++) {
      await page.locator('[role="feed"]').evaluate((el) => el.scrollTo(0, el.scrollHeight)).catch(() => {});
      await delay(1200);
    }

    // Collect all unique place URLs from the feed
    const placeUrls: string[] = await page.$$eval(
      '[role="feed"] a[href*="/maps/place/"]',
      (els) => {
        const seen = new Set<string>();
        const urls: string[] = [];
        for (const el of els) {
          const href = (el as HTMLAnchorElement).href;
          // Clean URL — remove query params after the /data= part for dedup
          const base = href.split("?")[0];
          if (!seen.has(base)) {
            seen.add(base);
            urls.push(href);
          }
        }
        return urls;
      }
    );

    console.log(`Found ${placeUrls.length} place URLs — visiting each one...`);

    // Also try to get names + thumbnails from the cards directly (fast, no navigation)
    const cardData: Record<string, { name: string; photoUrl?: string }> = {};
    const cards = await page.$$('[role="feed"] a[href*="/maps/place/"]');
    for (const card of cards) {
      try {
        const href = (await card.getAttribute("href")) ?? "";
        // Aria-label often contains: "Name · Rating stars · N reviews · Category"
        const label = (await card.getAttribute("aria-label")) ?? "";
        const namePart = label.split("·")[0].trim();
        // Thumbnail from within the link
        const thumbSrc = await card.$eval(
          'img[src*="googleusercontent.com"]',
          (img) => (img as HTMLImageElement).src
        ).catch(() => "");
        if (namePart && href) {
          const base = href.split("?")[0];
          cardData[base] = {
            name: namePart,
            photoUrl: thumbSrc ? upgradePhotoUrl(thumbSrc) : undefined,
          };
        }
      } catch { /* continue */ }
    }

    // Visit each place page to extract full details
    for (let i = 0; i < Math.min(placeUrls.length, LIMIT); i++) {
      if (results.length >= LIMIT) break;

      const url = placeUrls[i];
      const base = url.split("?")[0];
      const cardInfo = cardData[base] ?? {};

      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
        const detail = await extractPlacePage(page);

        // Prefer name from detail page; fall back to aria-label
        const name = (detail.name && detail.name.length > 2 && detail.name !== "Google Maps")
          ? detail.name
          : cardInfo.name ?? "";

        if (!name || seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());

        // Prefer full-size photo from detail page; fall back to thumbnail
        const photoUrl = detail.photoUrl || cardInfo.photoUrl;

        // Sanitize address — some Google Maps pages return "[]" or empty
        const rawAddr = detail.address?.trim() ?? "";
        const cleanAddr = rawAddr && rawAddr !== "[]" && rawAddr !== "null"
          ? rawAddr
          : SEARCH_LOCATION;

        results.push({
          placeId: `gmap-${Date.now()}-${i}`,
          name,
          address: cleanAddr,
          city: CITY.toLowerCase(),   // always stored under the parent city
          phone: detail.phone,
          rating: detail.rating,
          photoUrl,
          types: ["establishment"],
        });

        const photoIcon = photoUrl ? "📷" : "  ";
        process.stdout.write(
          `\r  [${results.length}/${LIMIT}] ${photoIcon} ${name.slice(0, 45).padEnd(45)}`
        );

        // Random delay between places to avoid rate limits
        await delay(1500 + Math.random() * 1000);
      } catch {
        // Skip this URL
      }
    }

    console.log(`\n\nDone. Collected ${results.length} venues.`);
  } finally {
    await delay(800);
    await browser.close();
  }

  return results;
}

// ── MongoDB push ──────────────────────────────────────────────────────────────
async function pushToMongo(venues: VenueResult[]) {
  const mongoUri = process.env.MONGODB_URI;
  const systemUserId = process.env.SYSTEM_USER_ID;
  if (!mongoUri) throw new Error("MONGODB_URI not set");
  if (!systemUserId) throw new Error("SYSTEM_USER_ID not set");

  const { default: mongoose } = await import("mongoose");
  await mongoose.connect(mongoUri);
  const { default: Property } = await import("../lib/db/models/Property.model");

  const FALLBACK = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop";
  let created = 0, skipped = 0;

  for (const v of venues) {
    try {
      await Property.create({
        vendorId: new mongoose.Types.ObjectId(systemUserId),
        title: v.name,
        description: `${v.name} is a farmhouse and event venue in ${CITY}. Available for parties, weddings, and celebrations.`,
        location: { city: CITY.toLowerCase(), address: v.address },
        capacity: { min: 50, max: 300 },
        priceRange: { min: 10000, max: 50000 },
        amenities: [],
        images: [{ url: v.photoUrl ?? FALLBACK, publicId: v.placeId, order: 0 }],
        status: "approved",
        source: "scraped",
        claimed: false,
        scrapedPhone: v.phone,
      });
      created++;
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("duplicate key")) skipped++;
    }
  }

  await mongoose.disconnect();
  console.log(`MongoDB: created=${created}, skipped=${skipped}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🗺  Google Maps Scraper — BookMyFarmhouse");
  console.log(`   City: ${CITY}${AREA ? ` | Area: ${AREA}` : ""} | Keyword: ${KEYWORD} | Limit: ${LIMIT}\n`);

  const results = await scrapeGoogleMaps();

  if (results.length === 0) {
    console.log("\nNo venues scraped.");
    console.log("Tips:");
    console.log("  1. Wait a few minutes and retry (rate limit)");
    console.log("  2. Try: --keyword resort  or  --keyword 'event venue'");
    process.exit(1);
  }

  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const location = (AREA ?? CITY).toLowerCase().replace(/\s+/g, "-");
  const slug = `${location}-${KEYWORD.toLowerCase().replace(/\s+/g, "-")}`;
  const outputFile = path.join(outputDir, `${slug}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));

  console.log(`Saved → ${outputFile}\n`);
  console.log("Preview:");
  results.slice(0, 5).forEach((r) =>
    console.log(`  • ${r.name.padEnd(40)} | ⭐${r.rating ?? "n/a"} | 📷${r.photoUrl ? "✓" : "✗"} | 📞${r.phone ?? "—"}`)
  );

  if (PUSH) {
    console.log("\nPushing to MongoDB...");
    await pushToMongo(results);
  } else {
    console.log(`\n→ Paste ${outputFile} into Admin → Scraper → Import JSON`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
