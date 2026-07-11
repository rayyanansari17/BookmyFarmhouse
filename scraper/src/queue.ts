import Bull from "bull";

export interface ScrapeJobData {
  jobId: string;
  source: string;
  query: string;
  city: string;
  limit: number;
  callbackUrl: string;
}

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

export const scrapeQueue = new Bull<ScrapeJobData>("scrape-jobs", redisUrl, {
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
