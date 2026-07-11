import "dotenv/config";
import express from "express";
import { scrapeQueue } from "./queue";
import "./worker"; // Start processing jobs

const app = express();
app.use(express.json());

const SECRET = process.env.SCRAPER_SECRET ?? "";

function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (SECRET && req.headers["x-scraper-secret"] !== SECRET) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

// Health check — no auth
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "bmf-scraper" });
});

// POST /jobs — enqueue a new scrape job
app.post("/jobs", authenticate, async (req, res) => {
  const { jobId, source, query, city, limit = 50, callbackUrl } = req.body as {
    jobId: string;
    source: string;
    query: string;
    city: string;
    limit?: number;
    callbackUrl: string;
  };

  if (!jobId || !source || !query || !city || !callbackUrl) {
    res.status(400).json({ error: "jobId, source, query, city, callbackUrl are required" });
    return;
  }

  const job = await scrapeQueue.add(
    { jobId, source, query, city, limit, callbackUrl },
    { jobId }
  );

  res.json({ queued: true, bullJobId: job.id });
});

// GET /jobs/:id — get Bull job status
app.get("/jobs/:id", authenticate, async (req, res) => {
  const job = await scrapeQueue.getJob(req.params.id);
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }

  const state = await job.getState();
  res.json({
    id: job.id,
    state,
    progress: job.progress(),
    data: job.data,
    failedReason: job.failedReason,
  });
});

const PORT = parseInt(process.env.PORT ?? "3001", 10);
app.listen(PORT, () => {
  console.log(`BMF Scraper service running on port ${PORT}`);
});
