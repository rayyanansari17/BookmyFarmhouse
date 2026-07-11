"use client";

import { useEffect, useState, useCallback, use } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface ScrapeJob {
  _id: string;
  source: string;
  query: string;
  city: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  found: number;
  imported: number;
  duplicatesSkipped: number;
  error?: string;
  logs: string[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

const STATUS_ICON = {
  queued: <Clock className="h-5 w-5 text-yellow-500" />,
  running: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />,
  completed: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  failed: <XCircle className="h-5 w-5 text-red-500" />,
};

const STATUS_COLORS: Record<string, string> = {
  queued: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  running: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function JobProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [job, setJob] = useState<ScrapeJob | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const fetchJob = useCallback(async () => {
    const res = await fetch(`/api/admin/scraper/jobs/${id}`);
    const data = await res.json();
    if (data.success) setJob(data.data);
    else setNotFound(true);
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  // Poll while running or queued
  useEffect(() => {
    if (!job || job.status === "completed" || job.status === "failed") return;
    const interval = setInterval(fetchJob, 2000);
    return () => clearInterval(interval);
  }, [job, fetchJob]);

  const handleCancel = async () => {
    if (!confirm("Cancel this scrape job?")) return;
    setCancelling(true);
    await fetch(`/api/admin/scraper/jobs/${id}`, { method: "DELETE" });
    fetchJob();
    setCancelling(false);
  };

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <XCircle className="h-10 w-10 opacity-40" />
        <p className="font-medium">Job not found</p>
        <Link href="/admin/scraper" className="text-sm text-primary hover:underline">
          Back to scraper
        </Link>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isActive = job.status === "queued" || job.status === "running";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/scraper" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground truncate">
              {job.query} · {job.city}
            </h1>
            <Badge variant="outline" className="capitalize text-[11px]">
              {job.source}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Started {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Status card */}
      <div className="border border-border rounded-2xl bg-card p-6 space-y-5">
        {/* Status + icon */}
        <div className="flex items-center gap-3">
          {STATUS_ICON[job.status]}
          <div>
            <span className={`text-sm font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[job.status]}`}>
              {job.status}
            </span>
          </div>
          {isActive && (
            <Button
              variant="outline"
              size="sm"
              disabled={cancelling}
              onClick={handleCancel}
              className="ml-auto text-destructive border-destructive/30 hover:bg-destructive/5"
            >
              {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Cancel job"}
            </Button>
          )}
        </div>

        {/* Progress bar */}
        {(isActive || job.status === "completed") && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{job.progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center bg-muted/50 rounded-xl p-3">
            <div className="text-2xl font-bold text-foreground">{job.found}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Found</div>
          </div>
          <div className="text-center bg-muted/50 rounded-xl p-3">
            <div className="text-2xl font-bold text-foreground">{job.imported}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Imported</div>
          </div>
          <div className="text-center bg-muted/50 rounded-xl p-3">
            <div className="text-2xl font-bold text-foreground">{job.duplicatesSkipped ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Skipped</div>
          </div>
        </div>

        {/* Error */}
        {job.error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl p-3">
            <p className="text-sm text-red-700 dark:text-red-400">{job.error}</p>
          </div>
        )}

        {/* View results link */}
        {job.status === "completed" && job.imported > 0 && (
          <Link
            href={`/admin/scraper/review?jobId=${id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            View {job.imported} imported listings
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* Log */}
      {job.logs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Job log</h3>
          <div className="bg-muted/50 rounded-xl border border-border p-4 font-mono text-xs space-y-1 max-h-64 overflow-y-auto">
            {[...job.logs].reverse().slice(0, 10).map((log, i) => (
              <div key={i} className="text-muted-foreground">{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
