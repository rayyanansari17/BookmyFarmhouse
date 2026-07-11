import axios from "axios";
import { scrapeQueue, ScrapeJobData } from "./queue";
import { scrapeJustdial } from "./scrapers/justdial";
import { closeBrowser } from "./scrapers/base";

const SCRAPER_SECRET = process.env.SCRAPER_SECRET ?? "";

function headers() {
  return {
    "Content-Type": "application/json",
    ...(SCRAPER_SECRET ? { "x-scraper-secret": SCRAPER_SECRET } : {}),
  };
}

async function patchProgress(
  callbackUrl: string,
  jobId: string,
  update: Record<string, unknown>
): Promise<void> {
  try {
    await axios.patch(
      `${callbackUrl}/api/admin/scraper/jobs/${jobId}/progress`,
      update,
      { headers: headers(), timeout: 8000 }
    );
  } catch {
    // Non-fatal — progress updates are best-effort
  }
}

scrapeQueue.process(async (job) => {
  const { jobId, source, query, city, limit, callbackUrl } = job.data as ScrapeJobData;

  await patchProgress(callbackUrl, jobId, { status: "running", logEntry: `Starting ${source} scrape for "${query}" in ${city}` });

  try {
    let venues: Awaited<ReturnType<typeof scrapeJustdial>> = [];

    if (source === "justdial") {
      venues = await scrapeJustdial(query, city, limit, async (found, total) => {
        const progress = Math.round((found / Math.max(total, 1)) * 100);
        await patchProgress(callbackUrl, jobId, {
          found,
          progress,
          logEntry: `Scraped ${found}/${total}`,
        });
      });
    } else {
      // Sulekha / WedMeGood — not yet implemented, mark as failed
      await patchProgress(callbackUrl, jobId, {
        error: `Scraper for source "${source}" is not yet implemented`,
      });
      return;
    }

    // Push results back to Vercel
    await axios.post(
      `${callbackUrl}/api/admin/scraper/jobs/${jobId}/results`,
      { listings: venues },
      { headers: headers(), timeout: 30000 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown scraper error";
    await patchProgress(callbackUrl, jobId, { error: msg });
  }
});

scrapeQueue.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

scrapeQueue.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await scrapeQueue.close();
  await closeBrowser();
  process.exit(0);
});

console.log("BMF Scraper worker started — listening for jobs");
