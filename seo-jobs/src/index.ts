import "dotenv/config";
import express from "express";
import { seoQueue, SeoJobType } from "./queue";
import "./worker";

const app = express();
app.use(express.json());

const SECRET = process.env.SEO_JOB_SECRET ?? "";

const VALID_JOB_TYPES: SeoJobType[] = [
  "sync-gsc", "sync-ga4", "sync-cwv",
  "sync-rank-tracking", "run-triggers", "gen-suggestions", "generate-blog",
];

function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (SECRET && req.headers["x-seo-secret"] !== SECRET) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

// Health check — no auth
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "bmf-seo-jobs" });
});

// POST /jobs — enqueue a new SEO job
app.post("/jobs", authenticate, async (req, res) => {
  const { type, payload } = req.body as { type: SeoJobType; payload?: Record<string, unknown> };

  if (!type || !VALID_JOB_TYPES.includes(type)) {
    res.status(400).json({ error: `Invalid job type. Must be one of: ${VALID_JOB_TYPES.join(", ")}` });
    return;
  }

  const job = await seoQueue.add({ type, payload });
  res.json({ queued: true, bullJobId: job.id, type });
});

// GET /jobs/:id — check Bull job status
app.get("/jobs/:id", authenticate, async (req, res) => {
  const job = await seoQueue.getJob(req.params.id);
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

const PORT = parseInt(process.env.PORT ?? "3002", 10);
app.listen(PORT, () => {
  console.log(`BMF SEO Jobs service running on port ${PORT}`);
});
