"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search, CheckSquare, Square, Loader2, Globe, MapPin,
  CheckCircle2, PlusCircle, X, Upload, Eye, Zap, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { PlaceResult } from "@/app/api/admin/scraper/route";

const CITY_OPTIONS = [
  "Hyderabad", "Bangalore", "Mumbai", "Delhi", "Chennai",
  "Pune", "Kolkata", "Jaipur", "Ahmedabad", "Lucknow",
  "Noida", "Gurgaon", "Chandigarh", "Indore", "Bhopal",
];

const KEYWORD_OPTIONS = [
  { value: "farmhouse", label: "Farmhouse" },
  { value: "farmhouse for events", label: "Farmhouse for Events" },
  { value: "villa for rent", label: "Villa for Rent" },
  { value: "event venue", label: "Event Venue" },
  { value: "resort for events", label: "Resort for Events" },
];

const BLANK_MANUAL: PlaceResult = {
  placeId: "", name: "", address: "", city: "", phone: "", website: "", types: [],
};

interface ScrapeJob {
  _id: string;
  source: string;
  query: string;
  city: string;
  status: "queued" | "running" | "completed" | "failed";
  found: number;
  imported: number;
  createdAt: string;
}

const JOB_STATUS_COLORS: Record<string, string> = {
  queued: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  running: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function ScraperPage() {
  const router = useRouter();

  // Start Scrape state
  const [scrapeSource, setScrapeSource] = useState("justdial");
  const [scrapeCity, setScrapeCity] = useState("");
  const [scrapeQuery, setScrapeQuery] = useState("farmhouses");
  const [scrapeLimit, setScrapeLimit] = useState(50);
  const [scraping, setScraping] = useState(false);
  const [recentJobs, setRecentJobs] = useState<ScrapeJob[]>([]);

  // OSM scraper state
  const [city, setCity] = useState("");
  const [keyword, setKeyword] = useState("farmhouse");
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<{ created: number; skipped: number } | null>(null);

  // Import JSON state
  const [importJson, setImportJson] = useState("");
  const [importCity, setImportCity] = useState("");
  const [importPreview, setImportPreview] = useState<PlaceResult[]>([]);
  const [importJsonError, setImportJsonError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState<{ created: number; skipped: number } | null>(null);

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual entry state
  const [manualCity, setManualCity] = useState("");
  const [manualVenues, setManualVenues] = useState<PlaceResult[]>([{ ...BLANK_MANUAL }]);
  const [manualApproving, setManualApproving] = useState(false);
  const [manualDone, setManualDone] = useState<{ created: number } | null>(null);

  useEffect(() => {
    fetch("/api/admin/scraper/jobs?limit=5")
      .then((r) => r.json())
      .then((d) => { if (d.success) setRecentJobs(d.data); })
      .catch(() => {});
  }, []);

  async function handleStartScrape() {
    if (!scrapeCity) { toast.error("Select a city first"); return; }
    if (!scrapeQuery.trim()) { toast.error("Enter a search query"); return; }
    setScraping(true);
    try {
      const res = await fetch("/api/admin/scraper/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: scrapeSource,
          query: scrapeQuery,
          city: scrapeCity.toLowerCase(),
          limit: scrapeLimit,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Scrape job created — redirecting to progress page");
      router.push(`/admin/scraper/jobs/${data.data._id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start scrape");
    } finally {
      setScraping(false);
    }
  }

  async function handleScrape() {
    if (!city) { toast.error("Select a city first"); return; }
    setLoading(true);
    setResults([]);
    setSelected(new Set());
    setDone(null);
    try {
      const res = await fetch("/api/admin/scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: city.toLowerCase(), keyword }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      if (data.data.length === 0) {
        toast.info(
          "OpenStreetMap has no venue data for this city. Use Import JSON (recommended) to import real Google Maps data, or switch to Manual Add.",
          { duration: 6000 }
        );
        return;
      }
      setResults(data.data);
      setSelected(new Set(data.data.map((r: PlaceResult) => r.placeId)));
      toast.success(`Found ${data.data.length} venues in ${city} via OpenStreetMap`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Scrape failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (selected.size === 0) { toast.error("Select at least one venue"); return; }
    setApproving(true);
    try {
      const toApprove = results.filter((r) => selected.has(r.placeId));
      const res = await fetch("/api/admin/scraper/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results: toApprove, city: city.toLowerCase() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setDone({ created: data.created, skipped: data.skipped });
      toast.success(`Created ${data.created} listings${data.skipped ? `, skipped ${data.skipped} duplicates` : ""}`);
      setResults([]);
      setSelected(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setApproving(false);
    }
  }

  async function handleManualApprove() {
    if (!manualCity) { toast.error("Select a city for these venues"); return; }
    const validVenues = manualVenues.filter((v) => v.name.trim());
    if (validVenues.length === 0) { toast.error("Enter at least one venue name"); return; }

    setManualApproving(true);
    try {
      const withIds = validVenues.map((v, i) => ({
        ...v,
        placeId: `manual-${Date.now()}-${i}`,
        city: manualCity.toLowerCase(),
        address: v.address || manualCity,
      }));
      const res = await fetch("/api/admin/scraper/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results: withIds, city: manualCity.toLowerCase() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setManualDone({ created: data.created });
      setManualVenues([{ ...BLANK_MANUAL }]);
      toast.success(`Published ${data.created} venue${data.created !== 1 ? "s" : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setManualApproving(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setImportJson(text);
      setImportJsonError("");
      setImportDone(null);
      // Auto-preview after loading
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.name) {
          if (!importCity && parsed[0]?.city) setImportCity(parsed[0].city);
          setImportPreview(parsed as PlaceResult[]);
          toast.success(`Loaded ${parsed.length} venues from file`);
        }
      } catch { /* user can still click Preview */ }
    };
    reader.readAsText(file);
    // Reset so same file can be re-uploaded
    e.target.value = "";
  }

  function handleImportPreview() {
    setImportJsonError("");
    setImportDone(null);
    if (!importJson.trim()) { setImportJsonError("Paste JSON first"); return; }
    try {
      const parsed = JSON.parse(importJson);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Expected a non-empty JSON array");
      const invalid = parsed.filter((r) => !r.name || typeof r.name !== "string");
      if (invalid.length > 0) throw new Error("Each entry must have a \"name\" field");
      // Normalise city from first entry if not manually set
      if (!importCity && parsed[0]?.city) setImportCity(parsed[0].city);
      setImportPreview(parsed as PlaceResult[]);
      toast.success(`Parsed ${parsed.length} venues — review and click Import All`);
    } catch (err) {
      setImportJsonError(err instanceof Error ? err.message : "Invalid JSON");
    }
  }

  async function handleImportAll() {
    if (importPreview.length === 0) { toast.error("Preview the JSON first"); return; }
    const city = importCity || importPreview[0]?.city;
    if (!city) { toast.error("Set a city for these venues"); return; }
    setImporting(true);
    try {
      const res = await fetch("/api/admin/scraper/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results: importPreview, city: city.toLowerCase() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setImportDone({ created: data.created, skipped: data.skipped ?? 0 });
      toast.success(`Imported ${data.created} listing${data.created !== 1 ? "s" : ""}`);
      setImportPreview([]);
      setImportJson("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  function toggleAll() {
    if (selected.size === results.length) setSelected(new Set());
    else setSelected(new Set(results.map((r) => r.placeId)));
  }

  function toggleOne(placeId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  }

  function updateManualVenue(i: number, field: keyof PlaceResult, value: string) {
    setManualVenues((prev) => prev.map((v, idx) => idx === i ? { ...v, [field]: value } : v));
  }

  function addManualVenue() {
    setManualVenues((prev) => [...prev, { ...BLANK_MANUAL }]);
  }

  function removeManualVenue(i: number) {
    setManualVenues((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Listing Scraper</h1>
            <Badge variant="secondary" className="text-xs">Free — OpenStreetMap</Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Import real Google Maps venues, search OpenStreetMap, or add manually
          </p>
        </div>
        <a
          href="/admin/scraper/review"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Review Scraped Listings
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <Tabs defaultValue="scrape">
        <TabsList className="mb-4">
          <TabsTrigger value="scrape">
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            Start Scrape
          </TabsTrigger>
          <TabsTrigger value="import">Import JSON ✦</TabsTrigger>
          <TabsTrigger value="osm">OSM Search</TabsTrigger>
          <TabsTrigger value="manual">Manual Add</TabsTrigger>
        </TabsList>

        {/* ── START SCRAPE TAB ── */}
        <TabsContent value="scrape" className="space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Launch a Scrape Job</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Source buttons */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { id: "justdial", label: "JustDial" },
                    { id: "sulekha", label: "Sulekha" },
                    { id: "wedmegood", label: "WedMeGood" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setScrapeSource(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        scrapeSource === s.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border text-foreground hover:border-primary/50"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* City */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">City</label>
                  <Select value={scrapeCity} onValueChange={(v) => v && setScrapeCity(v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITY_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Query */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Query</label>
                  <input
                    type="text"
                    value={scrapeQuery}
                    onChange={(e) => setScrapeQuery(e.target.value)}
                    placeholder="farmhouses in Hyderabad"
                    className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Limit slider */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Limit — {scrapeLimit} listings
                </label>
                <input
                  type="range"
                  min={10}
                  max={200}
                  step={10}
                  value={scrapeLimit}
                  onChange={(e) => setScrapeLimit(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>10</span><span>200</span>
                </div>
              </div>

              <Button
                onClick={handleStartScrape}
                disabled={scraping || !scrapeCity}
                className="gap-2"
              >
                {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {scraping ? "Creating job…" : "Start Scrape"}
              </Button>

              <p className="text-xs text-muted-foreground">
                Requires the Railway scraper service to be running. Jobs are queued asynchronously — you&apos;ll be redirected to the progress page.
              </p>
            </CardContent>
          </Card>

          {/* Recent jobs */}
          {recentJobs.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Recent jobs</h3>
              <div className="space-y-2">
                {recentJobs.map((job) => (
                  <div
                    key={job._id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                  >
                    <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                      {job.source}
                    </Badge>
                    <span className="text-sm text-foreground flex-1 truncate">
                      {job.query} · {job.city}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${JOB_STATUS_COLORS[job.status]}`}>
                      {job.status}
                    </span>
                    {job.status === "completed" && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {job.found} found · {job.imported} imported
                      </span>
                    )}
                    <a
                      href={`/admin/scraper/jobs/${job._id}`}
                      className="text-xs text-primary hover:underline shrink-0"
                    >
                      View →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── OSM SCRAPER TAB ── */}
        <TabsContent value="osm" className="space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Scrape Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="space-y-1.5 w-48">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">City</label>
                  <Select value={city} onValueChange={(v) => v && setCity(v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITY_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 w-52">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Keyword</label>
                  <Select value={keyword} onValueChange={(v) => v && setKeyword(v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KEYWORD_OPTIONS.map((k) => (
                        <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleScrape} disabled={loading || !city} className="gap-2 h-9">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {loading ? "Searching OSM..." : "Start Scrape"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Searches OpenStreetMap — free, no key needed. Coverage of Indian venues is limited; use <strong>Import JSON</strong> for better results.
              </p>
            </CardContent>
          </Card>

          {/* Success */}
          {done && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900/30">
              <CardContent className="pt-5 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Listings published</p>
                  <p className="text-sm text-muted-foreground">
                    Created {done.created} new listing{done.created !== 1 ? "s" : ""}
                    {done.skipped > 0 && `, skipped ${done.skipped} duplicate${done.skipped !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border border-border rounded-xl p-4 space-y-3">
                  <Skeleton className="h-36 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleAll}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {selected.size === results.length
                      ? <CheckSquare className="h-4 w-4 text-primary" />
                      : <Square className="h-4 w-4" />}
                    {selected.size === results.length ? "Deselect all" : "Select all"}
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {selected.size} of {results.length} selected
                  </span>
                </div>
                <Button onClick={handleApprove} disabled={approving || selected.size === 0} className="gap-2">
                  {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {approving ? "Publishing..." : `Publish Selected (${selected.size})`}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((place) => {
                  const isSelected = selected.has(place.placeId);
                  return (
                    <div
                      key={place.placeId}
                      onClick={() => toggleOne(place.placeId)}
                      className={`border rounded-xl overflow-hidden cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      <div className="h-24 bg-muted flex items-center justify-center">
                        <Globe className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">
                            {place.name}
                          </h3>
                          {isSelected
                            ? <CheckSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            : <Square className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />}
                        </div>
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                          <span className="line-clamp-2">{place.address}</span>
                        </div>
                        {place.website && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Globe className="h-3 w-3 shrink-0 text-primary" />
                            <span className="truncate">{place.website.replace(/^https?:\/\//, "")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── MANUAL ADD TAB ── */}
        <TabsContent value="manual" className="space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Add Venues Manually</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5 w-56">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">City</Label>
                <Select value={manualCity} onValueChange={(v) => v && setManualCity(v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {manualVenues.map((v, i) => (
                  <div key={i} className="border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Venue #{i + 1}</span>
                      {manualVenues.length > 1 && (
                        <button
                          onClick={() => removeManualVenue(i)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Venue Name *</Label>
                        <Input
                          placeholder="e.g. Green Valley Farmhouse"
                          value={v.name}
                          onChange={(e) => updateManualVenue(i, "name", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Phone (optional)</Label>
                        <Input
                          placeholder="+91 98765 43210"
                          value={v.phone ?? ""}
                          onChange={(e) => updateManualVenue(i, "phone", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">Address (optional)</Label>
                        <Input
                          placeholder="Street / area name"
                          value={v.address}
                          onChange={(e) => updateManualVenue(i, "address", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">Website (optional)</Label>
                        <Input
                          placeholder="https://example.com"
                          value={v.website ?? ""}
                          onChange={(e) => updateManualVenue(i, "website", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={addManualVenue} className="gap-2">
                  <PlusCircle className="h-4 w-4" /> Add Another Venue
                </Button>
                <Button
                  onClick={handleManualApprove}
                  disabled={manualApproving || !manualCity || manualVenues.every((v) => !v.name.trim())}
                  className="gap-2"
                >
                  {manualApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {manualApproving ? "Publishing..." : `Publish ${manualVenues.filter((v) => v.name.trim()).length} Venue(s)`}
                </Button>
              </div>

              {manualDone && (
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Published {manualDone.created} venue{manualDone.created !== 1 ? "s" : ""} successfully
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── IMPORT JSON TAB ── */}
        <TabsContent value="import" className="space-y-6">
          {/* Instructions card */}
          <Card className="border-border bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                Import from Google Maps Scraper
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Run the local Playwright script to collect <strong>real venue photos</strong> from Google Maps, then paste the JSON output here.</p>
              <div className="bg-muted rounded-lg p-3 font-mono text-xs space-y-1 overflow-x-auto">
                <p className="text-foreground font-semibold text-xs mb-1"># One-time setup:</p>
                <p>npm install -D playwright tsx</p>
                <p>npx playwright install chromium</p>
                <p className="mt-2 text-foreground font-semibold text-xs"># Run scraper:</p>
                <p>npx tsx scripts/scrape-google-maps.ts --city hyderabad</p>
                <p className="text-muted-foreground/60 text-[11px]"># Output saved to scripts/output/hyderabad-farmhouse.json</p>
              </div>
              <p className="text-xs">Photos are sourced from <code className="bg-muted px-1 rounded">lh3.googleusercontent.com</code> — the actual images venue owners uploaded to Google Maps.</p>
            </CardContent>
          </Card>

          {/* JSON input */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">Paste or Upload Scraped JSON</CardTitle>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Upload className="h-3.5 w-3.5" /> Upload .json file
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  City (overrides city in JSON if set)
                </Label>
                <Select value={importCity} onValueChange={(v) => v && setImportCity(v)}>
                  <SelectTrigger className="h-9 w-56">
                    <SelectValue placeholder="Auto-detect from JSON" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  JSON Output from scrape-google-maps.ts
                </Label>
                <Textarea
                  placeholder={'[\n  {\n    "name": "Green Valley Farmhouse",\n    "address": "Shamshabad, Hyderabad",\n    "city": "hyderabad",\n    "photoUrl": "https://lh3.googleusercontent.com/...",\n    "rating": 4.3\n  }\n]'}
                  value={importJson}
                  onChange={(e) => { setImportJson(e.target.value); setImportJsonError(""); }}
                  className="font-mono text-xs min-h-[180px] resize-y"
                />
                {importJsonError && (
                  <p className="text-xs text-destructive">{importJsonError}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleImportPreview}
                  disabled={!importJson.trim()}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" /> Preview Venues
                </Button>
                {importPreview.length > 0 && (
                  <Button
                    onClick={handleImportAll}
                    disabled={importing}
                    className="gap-2"
                  >
                    {importing
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <CheckCircle2 className="h-4 w-4" />}
                    {importing ? "Importing..." : `Import All (${importPreview.length})`}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Success banner */}
          {importDone && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900/30">
              <CardContent className="pt-5 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Listings imported</p>
                  <p className="text-sm text-muted-foreground">
                    Created {importDone.created} new listing{importDone.created !== 1 ? "s" : ""}
                    {importDone.skipped > 0 && `, skipped ${importDone.skipped} duplicate${importDone.skipped !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview grid */}
          {importPreview.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                {importPreview.length} venues ready to import
                {importPreview.filter((r) => r.photoUrl).length > 0 && (
                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                    ✓ {importPreview.filter((r) => r.photoUrl).length} with real Google Maps photos
                  </span>
                )}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {importPreview.map((place, idx) => (
                  <div
                    key={place.placeId ?? idx}
                    className="border border-border rounded-xl overflow-hidden"
                  >
                    {/* Photo preview */}
                    <div className="h-32 bg-muted relative overflow-hidden">
                      {place.photoUrl ? (
                        <Image
                          src={place.photoUrl}
                          alt={place.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Globe className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 space-y-2">
                      <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">
                        {place.name}
                      </h3>
                      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                        <span className="line-clamp-2">{place.address}</span>
                      </div>
                      {place.rating && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">★ {place.rating}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
