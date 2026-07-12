"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2, Trash2, Users, MessageSquare, MapPin, Database,
  ScanSearch, Key, ScrollText, AlertTriangle, RefreshCw, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

// ─── Types ───────────────────────────────────────────────────────────────────

type CollectionKey =
  | "properties" | "deletedProperties" | "users" | "inquiries"
  | "locations" | "scrapedListings" | "scrapeJobs" | "refreshTokens" | "requestLogs";

interface Stats {
  properties: number;
  deletedProperties: number;
  users: number;
  inquiries: number;
  locations: number;
  scrapedListings: number;
  scrapeJobs: number;
  refreshTokens: number;
  requestLogs: number;
}

interface CardDef {
  key: CollectionKey;
  label: string;
  icon: React.ElementType;
  description: string;
  cascadeNote?: string;
}

const CARDS: CardDef[] = [
  {
    key: "properties",
    label: "Live Properties",
    icon: Building2,
    description: "Active property listings on the platform.",
    cascadeNote: "Also wipes all Inquiries (cascade).",
  },
  {
    key: "deletedProperties",
    label: "Deleted Properties",
    icon: Trash2,
    description: "Soft-deleted listings (isDeleted: true).",
  },
  {
    key: "users",
    label: "Vendors / Users",
    icon: Users,
    description: "All registered vendor and admin accounts.",
    cascadeNote: "Also wipes all Refresh Tokens (cascade).",
  },
  {
    key: "inquiries",
    label: "Inquiries",
    icon: MessageSquare,
    description: "All customer inquiry submissions.",
  },
  {
    key: "locations",
    label: "Locations",
    icon: MapPin,
    description: "Managed city / state pairs for dropdowns.",
  },
  {
    key: "scrapedListings",
    label: "Scraped Listings",
    icon: ScanSearch,
    description: "Listings in the scraper staging collection.",
  },
  {
    key: "scrapeJobs",
    label: "Scrape Jobs",
    icon: Database,
    description: "Scraper job records and their progress logs.",
  },
  {
    key: "refreshTokens",
    label: "Refresh Tokens",
    icon: Key,
    description: "Active JWT refresh token tracking records.",
  },
  {
    key: "requestLogs",
    label: "Request Logs",
    icon: ScrollText,
    description: "API audit trail (auto-expires after 90 days).",
  },
];

// ─── Main ────────────────────────────────────────────────────────────────────

export default function SystemStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wipeTarget, setWipeTarget] = useState<CardDef | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [wiping, setWiping] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.success) setStats(data.data);
      else setError(data.error ?? "Failed to load stats");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const openWipe = (card: CardDef) => {
    setConfirmText("");
    setWipeTarget(card);
  };

  const handleWipe = async () => {
    if (!wipeTarget || confirmText !== "delete") return;
    setWiping(true);
    try {
      const res = await fetch(`/api/admin/stats/wipe/${wipeTarget.key}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setStats((prev) => prev ? { ...prev, [wipeTarget.key]: 0 } : prev);
        setWipeTarget(null);
      }
    } finally {
      setWiping(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Stats</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Live record counts across all collections.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading} className="gap-1.5">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          const count = stats?.[card.key];
          return (
            <div
              key={card.key}
              className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4 shadow-sm"
            >
              <div className="p-2.5 rounded-xl bg-muted shrink-0">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{card.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{card.description}</p>
                <p className="text-3xl font-bold text-foreground mt-2 tabular-nums">
                  {loading ? <span className="text-muted-foreground text-base">—</span> : (count ?? 0).toLocaleString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2 text-xs"
                onClick={() => openWipe(card)}
              >
                Wipe
              </Button>
            </div>
          );
        })}
      </div>

      {/* Wipe confirmation dialog */}
      <Dialog open={!!wipeTarget} onOpenChange={(o) => !o && setWipeTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Wipe {wipeTarget?.label}?
            </DialogTitle>
            <DialogDescription className="space-y-2 text-sm text-muted-foreground mt-2">
              This permanently deletes <strong>all {wipeTarget?.label}</strong> from the database. This cannot be undone.
              {wipeTarget?.cascadeNote && (
                <span className="block text-amber-600 dark:text-amber-400 font-medium mt-1">{wipeTarget.cascadeNote}</span>
              )}
              <span className="block mt-3">Type <strong className="text-foreground font-mono">delete</strong> to confirm:</span>
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete"
            className="font-mono"
            autoFocus
          />
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setWipeTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={confirmText !== "delete" || wiping}
              onClick={handleWipe}
            >
              {wiping && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Delete all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
