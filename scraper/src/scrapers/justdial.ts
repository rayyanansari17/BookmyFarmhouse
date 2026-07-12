import { newStealthContext, randomDelay } from "./base";

export interface ScrapedVenue {
  name: string;
  area?: string;
  city: string;
  address?: string;
  phone?: string;
  phones: string[];
  imageUrls: string[];
  amenities: string[];
  description?: string;
  capacity?: number;
  priceRange?: string;
  sourceUrl?: string;
  category: string;
}

type ProgressCallback = (found: number, total: number) => void;

function upgradePhotoUrl(src: string): string {
  return src
    .replace(/=w\d+-h\d+[^"']*/g, "=w1200-h800-k-no")
    .replace(/=s\d+[^"']*/g, "=w1200-h800-k-no");
}

// Google Maps scraper — more reliable than JustDial/Sulekha on Railway IPs
export async function scrapeJustdial(
  query: string,
  city: string,
  limit: number,
  onProgress?: ProgressCallback
): Promise<ScrapedVenue[]> {
  const ctx = await newStealthContext();
  const venues: ScrapedVenue[] = [];
  const seen = new Set<string>();

  try {
    const page = await ctx.newPage();
    const searchQuery = `${query} in ${city}`;
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;

    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await randomDelay(2500, 4000);

    // Accept cookie consent if shown
    for (const label of ["Accept all", "Accept All", "I agree"]) {
      const btn = page.getByRole("button", { name: new RegExp(`^${label}$`, "i") });
      if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await btn.click();
        await randomDelay(1000, 2000);
        break;
      }
    }

    // Wait for results feed
    await page.waitForSelector('[role="feed"]', { timeout: 20000 }).catch(() => {});

    // Scroll feed to load more results
    for (let i = 0; i < 6; i++) {
      await page.locator('[role="feed"]').evaluate((el) => el.scrollTo(0, el.scrollHeight)).catch(() => {});
      await randomDelay(1000, 2000);
    }

    // Collect all unique place URLs from feed
    const placeUrls: string[] = await page.$$eval(
      '[role="feed"] a[href*="/maps/place/"]',
      (els) => {
        const seen = new Set<string>();
        const urls: string[] = [];
        for (const el of els) {
          const href = (el as HTMLAnchorElement).href;
          const base = href.split("?")[0];
          if (!seen.has(base)) { seen.add(base); urls.push(href); }
        }
        return urls;
      }
    ).catch(() => [] as string[]);

    // Also grab aria-label names + thumbnails from cards (faster, no navigation)
    const cardData: Record<string, { name: string; photoUrl?: string }> = {};
    const cards = await page.$$('[role="feed"] a[href*="/maps/place/"]');
    for (const card of cards) {
      try {
        const href = (await card.getAttribute("href")) ?? "";
        const label = (await card.getAttribute("aria-label")) ?? "";
        const namePart = label.split("·")[0].trim();
        const thumbSrc = await card.$eval(
          'img[src*="googleusercontent.com"]',
          (img) => (img as HTMLImageElement).src
        ).catch(() => "");
        if (namePart && href) {
          const base = href.split("?")[0];
          cardData[base] = { name: namePart, photoUrl: thumbSrc ? upgradePhotoUrl(thumbSrc) : undefined };
        }
      } catch { /* skip */ }
    }

    // Visit each place page to extract full details
    for (let i = 0; i < Math.min(placeUrls.length, limit); i++) {
      if (venues.length >= limit) break;
      const url = placeUrls[i];
      const base = url.split("?")[0];
      const cardInfo = cardData[base] ?? {};

      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
        await randomDelay(1500, 2500);

        // Name
        let name = "";
        for (const sel of ['h1.DUwDvf', 'h1[class*="DUwDvf"]', 'h1[class*="fontDisplay"]', 'h1']) {
          name = await page.$eval(sel, (el) => el.textContent?.trim() ?? "").catch(() => "");
          if (name && name !== "Google Maps" && name.length > 1) break;
        }
        name = name || cardInfo.name || "";
        if (!name || seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());

        // Address
        let address = "";
        const addrSelectors = [
          '[data-item-id="address"] .Io6YTe',
          'button[data-item-id="address"] .Io6YTe',
          '[data-tooltip="Copy address"] .Io6YTe',
        ];
        for (const sel of addrSelectors) {
          address = await page.$eval(sel, (el) => el.textContent?.trim() ?? "").catch(() => "");
          if (address && address.length > 3) break;
        }
        if (!address) {
          const candidates = await page.$$eval('.Io6YTe',
            (els) => els.map((el) => el.textContent?.trim() ?? "").filter((t) => /\d/.test(t) && t.length > 5)
          ).catch(() => [] as string[]);
          address = candidates[0] ?? "";
        }
        const cleanAddr = address && address !== "[]" && address !== "null" ? address : city;

        // Phone
        const phone = await page.$eval(
          '[data-item-id*="phone"] .Io6YTe, [aria-label*="hone"] span.Io6YTe',
          (el) => el.textContent?.trim() ?? ""
        ).catch(() => "");

        // Rating
        const ratingText = await page.$eval(
          'span.ceNzKf[aria-hidden="true"]',
          (el) => el.textContent?.trim() ?? ""
        ).catch(() => "");

        // Photo — prefer full-size from detail page, fall back to thumbnail
        let photoUrl = cardInfo.photoUrl ?? "";
        const photoSelectors = [
          'img[src*="googleusercontent.com"][class*="Liguzb"]',
          'img[src*="googleusercontent.com"][width="408"]',
          'button[aria-label*="Photo"] img[src*="googleusercontent.com"]',
          'img[src*="googleusercontent.com"]',
        ];
        for (const sel of photoSelectors) {
          const src = await page.$eval(sel, (el) => (el as HTMLImageElement).src).catch(() => "");
          if (src && src.includes("googleusercontent.com") && !src.includes("=s40") && !src.includes("=s16")) {
            photoUrl = upgradePhotoUrl(src);
            break;
          }
        }

        const rating = ratingText ? parseFloat(ratingText) : undefined;

        venues.push({
          name,
          area: cleanAddr.split(",")[0]?.trim(),
          city: city.toLowerCase(),
          address: cleanAddr,
          phone: phone || undefined,
          phones: phone ? [phone] : [],
          imageUrls: photoUrl ? [photoUrl] : [],
          amenities: [],
          category: "farmhouse",
          sourceUrl: url,
          description: `${name} is a farmhouse and event venue located in ${cleanAddr || city}.${rating ? ` Rated ${rating}/5 on Google Maps.` : ""}`,
        });

        onProgress?.(venues.length, Math.min(placeUrls.length, limit));
        await randomDelay(2000, 4000);
      } catch { /* skip this place */ }
    }
  } finally {
    await ctx.close();
  }

  return venues;
}
