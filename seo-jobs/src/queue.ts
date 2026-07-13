import Bull from "bull";

export type SeoJobType =
  | "sync-gsc"
  | "sync-ga4"
  | "sync-cwv"
  | "sync-rank-tracking"
  | "run-triggers"
  | "gen-suggestions"
  | "generate-blog";

export interface SeoJobData {
  type: SeoJobType;
  payload?: Record<string, unknown>;
}

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

export const seoQueue = new Bull<SeoJobData>("seo-jobs", redisUrl, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 10_000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
