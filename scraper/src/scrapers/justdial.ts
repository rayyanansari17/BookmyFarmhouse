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

export async function scrapeJustdial(
  query: string,
  city: string,
  limit: number,
  onProgress?: ProgressCallback
): Promise<ScrapedVenue[]> {
  const ctx = await newStealthContext();
  const venues: ScrapedVenue[] = [];

  try {
    const page = await ctx.newPage();
    const citySlug = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();

    // JustDial search URL for farmhouses
    const searchUrl = `https://www.justdial.com/${citySlug}/Farmhouses`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await randomDelay(2000, 4000);

    // Scroll to load more results
    let lastCount = 0;
    for (let scroll = 0; scroll < 5; scroll++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
      await randomDelay(1500, 3000);

      // Check listing count
      const count = await page.$$eval(
        "[data-cid], .resultbox_info, .cntanr",
        (els) => els.length
      );
      if (count >= limit || count === lastCount) break;
      lastCount = count;
    }

    // Collect listing cards
    const cards = await page.$$("[data-cid], .resultbox_info");
    const toProcess = cards.slice(0, limit);

    for (let i = 0; i < toProcess.length; i++) {
      try {
        const card = toProcess[i];

        const name = await card.$eval(
          ".fn, .businessName, h2, [class*='title']",
          (el) => el.textContent?.trim() ?? ""
        ).catch(() => "");

        if (!name) continue;

        const address = await card.$eval(
          "[class*='address'], [class*='locality'], address",
          (el) => el.textContent?.trim() ?? ""
        ).catch(() => "");

        // Image URLs — JustDial CDN pattern
        const imgs = await card.$$eval(
          "img[src*='jdmagicbox'], img[src*='justdial'], img[src*='jdcdn']",
          (els) => els
            .map((img) => (img as HTMLImageElement).src)
            .filter((src) => src && !src.includes("placeholder") && !src.includes("noimage"))
        ).catch(() => [] as string[]);

        // Phone — may be hidden behind button
        let phone = "";
        const phoneEl = await card.$("[class*='phone'], [data-phone], a[href^='tel:']");
        if (phoneEl) {
          phone = await phoneEl.evaluate((el) => {
            if (el.tagName === "A") return (el as HTMLAnchorElement).href.replace("tel:", "");
            return el.getAttribute("data-phone") ?? el.textContent?.trim() ?? "";
          }).catch(() => "");
        }

        // Amenities / tags
        const tags = await card.$$eval(
          "[class*='tag'], [class*='label'], [class*='category']",
          (els) => els.map((el) => el.textContent?.trim() ?? "").filter(Boolean)
        ).catch(() => [] as string[]);

        // Source URL
        const href = await card.$eval(
          "a[href]",
          (el) => (el as HTMLAnchorElement).href
        ).catch(() => "");

        venues.push({
          name,
          area: address.split(",")[0]?.trim(),
          city: city.toLowerCase(),
          address,
          phone: phone || undefined,
          phones: phone ? [phone] : [],
          imageUrls: imgs.slice(0, 8),
          amenities: tags.slice(0, 10),
          category: "farmhouse",
          sourceUrl: href || undefined,
        });

        onProgress?.(venues.length, toProcess.length);

        // Rate-limit — random delay between cards
        await randomDelay(2000, 5000);
      } catch {
        // Skip individual card errors
      }
    }
  } finally {
    await ctx.close();
  }

  return venues;
}
