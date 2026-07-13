import { seoQueue, SeoJobData } from "./queue";
import { syncGsc } from "./jobs/sync-gsc";
import { syncGa4 } from "./jobs/sync-ga4";

seoQueue.process(async (job) => {
  const { type, payload } = job.data as SeoJobData;
  console.log(`[seo-jobs] Processing: ${type}`, payload ?? "");

  switch (type) {
    case "sync-gsc":
      await syncGsc();
      break;
    case "sync-ga4":
      await syncGa4();
      break;
    case "sync-cwv":
      console.log("sync-cwv: Phase B — PageSpeed Insights integration not yet implemented");
      break;
    case "sync-rank-tracking":
      console.log("sync-rank-tracking: Phase C — DataForSEO integration not yet implemented");
      break;
    case "run-triggers":
      console.log("run-triggers: Phase D — improvement trigger engine not yet implemented");
      break;
    case "gen-suggestions":
      console.log("gen-suggestions: Phase D — AI suggestion generation not yet implemented");
      break;
    case "generate-blog":
      console.log("generate-blog: handled directly via Next.js API route");
      break;
    default:
      throw new Error(`Unknown job type: ${type}`);
  }
});

seoQueue.on("completed", (job) => {
  console.log(`[seo-jobs] Completed: ${job.data.type} (job ${job.id})`);
});

seoQueue.on("failed", (job, err) => {
  console.error(`[seo-jobs] Failed: ${job.data.type} (job ${job.id})`, err.message);
});
