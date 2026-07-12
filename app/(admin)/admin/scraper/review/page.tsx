"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle, XCircle, Pencil, ChevronLeft, ChevronRight,
  MapPin, ArrowLeft, AlertTriangle, LayoutGrid, List, Trash2,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScrapedListing {
  _id: string;
  name: string;
  area?: string;
  city: string;
  address?: string;
  phone?: string;
  phones?: string[];
  imageUrls: string[];
  amenities: string[];
  description?: string;
  capacity?: number;
  priceRange?: string;
  source: string;
  status: "pending" | "approved" | "rejected" | "published";
  editedData?: Record<string, unknown>;
  adminNotes?: string;
  scrapedAt?: string;
  createdAt: string;
}

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "published";
type ViewMode = "grid" | "list";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  published: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
        checked
          ? "bg-primary border-primary"
          : "bg-white/90 dark:bg-background border-gray-300 dark:border-gray-600 hover:border-primary"
      }`}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L4 7L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const [listings, setListings] = useState<ScrapedListing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({});
  const [editingListing, setEditingListing] = useState<ScrapedListing | null>(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [bulkWorking, setBulkWorking] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const LIMIT = 24;

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (sourceFilter !== "all") params.set("source", sourceFilter);
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("limit", String(LIMIT));
    const res = await fetch(`/api/admin/scraper/scraped?${params}`);
    const data = await res.json();
    if (data.success) { setListings(data.data); setTotal(data.total); }
    setLoading(false);
  }, [statusFilter, sourceFilter, search, page]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleSearchChange = (v: string) => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => { setSearch(v); setPage(1); }, 300);
  };

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = listings.length > 0 && listings.every((l) => selectedIds.has(l._id));
  const someSelected = listings.some((l) => selectedIds.has(l._id));
  const toggleSelectAll = () => allSelected
    ? setSelectedIds((p) => { const n = new Set(p); listings.forEach((l) => n.delete(l._id)); return n; })
    : setSelectedIds((p) => new Set([...p, ...listings.map((l) => l._id)]));
  const clearSelection = () => setSelectedIds(new Set());

  const prevImage = (id: string, max: number) =>
    setImageIndexes((p) => ({ ...p, [id]: ((p[id] ?? 0) - 1 + max) % max }));
  const nextImage = (id: string, max: number) =>
    setImageIndexes((p) => ({ ...p, [id]: ((p[id] ?? 0) + 1) % max }));

  const bulkAction = async (action: "approve" | "reject") => {
    if (selectedIds.size === 0) return;
    setBulkWorking(true);
    const res = await fetch(`/api/admin/scraper/scraped/bulk-${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });
    const data = await res.json();
    if (data.success) { showToast(`${data.modified} listings ${action}d`); clearSelection(); fetchListings(); }
    else showToast(data.error ?? "Failed", false);
    setBulkWorking(false);
  };

  const handlePublish = async () => {
    setBulkWorking(true);
    const res = await fetch("/api/admin/scraper/scraped/bulk-publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });
    const data = await res.json();
    setShowPublishConfirm(false);
    if (data.success) { showToast(`Published ${data.published}, skipped ${data.skipped}`); clearSelection(); fetchListings(); }
    else showToast(data.error ?? "Publish failed", false);
    setBulkWorking(false);
  };

  const setStatus = async (id: string, status: "approved" | "rejected" | "pending") => {
    const res = await fetch(`/api/admin/scraper/scraped/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setListings((prev) => prev.map((l) => l._id === id ? { ...l, status } : l));
  };

  const deleteCard = async (id: string) => {
    if (!confirm("Delete this scraped listing?")) return;
    await fetch(`/api/admin/scraper/scraped/${id}`, { method: "DELETE" });
    setListings((prev) => prev.filter((l) => l._id !== id));
    setTotal((t) => t - 1);
  };

  const [editForm, setEditForm] = useState<Record<string, unknown>>({});
  const openEdit = (l: ScrapedListing) => {
    setEditForm({
      name: l.editedData?.name ?? l.name ?? "",
      city: l.editedData?.city ?? l.city ?? "",
      address: l.editedData?.address ?? l.address ?? "",
      phone: l.editedData?.phone ?? l.phone ?? (l.phones?.[0] ?? ""),
      description: l.editedData?.description ?? l.description ?? "",
      capacity: l.editedData?.capacity ?? l.capacity ?? "",
      priceRange: l.editedData?.priceRange ?? l.priceRange ?? "",
    });
    setEditingListing(l);
  };

  const saveEdit = async () => {
    if (!editingListing) return;
    const res = await fetch(`/api/admin/scraper/scraped/${editingListing._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editedData: editForm }),
    });
    const data = await res.json();
    if (data.success) { setListings((prev) => prev.map((l) => l._id === editingListing._id ? data.data : l)); setEditingListing(null); showToast("Edits saved"); }
    else showToast("Save failed", false);
  };

  const totalPages = Math.ceil(total / LIMIT);

  const getDisplay = (l: ScrapedListing) => ({
    name: (l.editedData?.name as string) ?? l.name,
    city: (l.editedData?.city as string) ?? l.city,
    addr: (l.editedData?.address as string) ?? l.address,
  });

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium text-white transition-all ${toast.ok ? "bg-green-600" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/admin/scraper" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Review Scraped Listings</h1>
            <p className="text-sm text-muted-foreground">{total} listing{total !== 1 ? "s" : ""} total</p>
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Status tabs */}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {(["all", "pending", "approved", "rejected", "published"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize ${statusFilter === s ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {s}
              </button>
            ))}
          </div>
          <Select value={sourceFilter} onValueChange={(v) => { if (v) { setSourceFilter(v); setPage(1); } }}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="justdial">JustDial</SelectItem>
              <SelectItem value="sulekha">Sulekha</SelectItem>
              <SelectItem value="wedmegood">WedMeGood</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Search name..." className="w-48 h-9" onChange={(e) => handleSearchChange(e.target.value)} />
        </div>

        {/* Bulk action bar — only when items selected */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex-wrap">
            <span className="text-sm font-semibold text-primary">{selectedIds.size} selected</span>
            <button onClick={clearSelection} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Clear</button>
            <div className="flex gap-2 ml-auto flex-wrap">
              <Button size="sm" variant="outline" disabled={bulkWorking} onClick={() => bulkAction("approve")}
                className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" /> Approve ({selectedIds.size})
              </Button>
              <Button size="sm" variant="outline" disabled={bulkWorking} onClick={() => bulkAction("reject")}
                className="text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 gap-1.5">
                <XCircle className="h-3.5 w-3.5" /> Reject ({selectedIds.size})
              </Button>
              <Button size="sm" disabled={bulkWorking} onClick={() => setShowPublishConfirm(true)}>
                Publish {selectedIds.size} to live site →
              </Button>
            </div>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          viewMode === "grid"
            ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-72 bg-muted rounded-2xl animate-pulse" />)}</div>
            : <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
        )}

        {/* Empty */}
        {!loading && listings.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No listings found</p>
            <p className="text-sm mt-1">Try changing the filters or run a scrape job first.</p>
          </div>
        )}

        {/* ── GRID VIEW ── */}
        {!loading && listings.length > 0 && viewMode === "grid" && (
          <div className="space-y-3">
            {/* Select all row */}
            <div className="flex items-center gap-3">
              <Checkbox checked={allSelected} onChange={toggleSelectAll} />
              <span className="text-sm text-muted-foreground">
                {allSelected ? "Deselect all" : someSelected ? `${selectedIds.size} selected` : "Select all on page"}
              </span>
              <span className="text-sm text-muted-foreground ml-auto">{listings.length} shown of {total}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing) => {
                const idx = imageIndexes[listing._id] ?? 0;
                const imgs = listing.imageUrls ?? [];
                const { name, city, addr } = getDisplay(listing);
                const sel = selectedIds.has(listing._id);

                return (
                  <div key={listing._id}
                    className={`relative bg-card border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md ${sel ? "ring-2 ring-primary border-transparent" : "border-border"}`}
                  >
                    {/* Checkbox */}
                    <div className="absolute top-3 left-3 z-10">
                      <Checkbox checked={sel} onChange={() => toggleSelect(listing._id)} />
                    </div>
                    {/* Status */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[listing.status]}`}>{listing.status}</span>
                    </div>
                    {/* Image */}
                    <div className="relative h-44 bg-muted overflow-hidden">
                      {imgs.length > 0
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={imgs[idx]} alt={name} className="w-full h-full object-cover" loading="lazy" />
                        : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
                      }
                      {imgs.length > 1 && (
                        <>
                          <button onClick={() => prevImage(listing._id, imgs.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5"><ChevronLeft className="h-4 w-4" /></button>
                          <button onClick={() => nextImage(listing._id, imgs.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5"><ChevronRight className="h-4 w-4" /></button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full">{idx + 1}/{imgs.length}</div>
                        </>
                      )}
                    </div>
                    {/* Body */}
                    <div className="p-4 space-y-2">
                      <div className="font-semibold text-foreground text-sm leading-tight line-clamp-2">{name}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{addr ? `${addr}, ` : ""}{city.charAt(0).toUpperCase() + city.slice(1)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{listing.source}</Badge>
                        <span>{formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })}</span>
                      </div>
                      {listing.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {listing.amenities.slice(0, 4).map((a) => <span key={a} className="text-[10px] bg-muted rounded-full px-2 py-0.5 text-muted-foreground">{a}</span>)}
                          {listing.amenities.length > 4 && <span className="text-[10px] text-muted-foreground">+{listing.amenities.length - 4}</span>}
                        </div>
                      )}
                      {/* Actions */}
                      <div className="flex items-center gap-1 pt-1 flex-wrap">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => openEdit(listing)}><Pencil className="h-3 w-3 mr-1" />Edit</Button>
                        {listing.status !== "approved" && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30" onClick={() => setStatus(listing._id, "approved")}><CheckCircle className="h-3 w-3 mr-1" />Approve</Button>
                        )}
                        {listing.status !== "rejected" && listing.status !== "published" && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => setStatus(listing._id, "rejected")}><XCircle className="h-3 w-3 mr-1" />Reject</Button>
                        )}
                        <button onClick={() => deleteCard(listing._id)} className="ml-auto text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── LIST VIEW ── */}
        {!loading && listings.length > 0 && viewMode === "list" && (
          <div className="rounded-xl border border-border overflow-hidden">
            {/* Table header */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Checkbox checked={allSelected} onChange={toggleSelectAll} />
              <div className="w-12 shrink-0" />
              <div className="flex-1">Name / Location</div>
              <div className="w-24 text-center hidden sm:block">Source</div>
              <div className="w-24 text-center hidden md:block">Scraped</div>
              <div className="w-24 text-center">Status</div>
              <div className="w-40 text-right">Actions</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
              {listings.map((listing) => {
                const imgs = listing.imageUrls ?? [];
                const { name, city, addr } = getDisplay(listing);
                const sel = selectedIds.has(listing._id);

                return (
                  <div key={listing._id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 ${sel ? "bg-primary/5" : ""}`}
                  >
                    <Checkbox checked={sel} onChange={() => toggleSelect(listing._id)} />
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                      {imgs[0]
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={imgs[0]} alt={name} className="w-full h-full object-cover" loading="lazy" />
                        : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">—</div>
                      }
                    </div>
                    {/* Name + location */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">{name}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{addr ? `${addr}, ` : ""}{city.charAt(0).toUpperCase() + city.slice(1)}</span>
                      </div>
                    </div>
                    {/* Source */}
                    <div className="w-24 text-center hidden sm:block">
                      <Badge variant="outline" className="text-[10px] capitalize">{listing.source}</Badge>
                    </div>
                    {/* Time */}
                    <div className="w-24 text-center text-xs text-muted-foreground hidden md:block">
                      {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })}
                    </div>
                    {/* Status */}
                    <div className="w-24 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[listing.status]}`}>{listing.status}</span>
                    </div>
                    {/* Actions */}
                    <div className="w-40 flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(listing)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                      {listing.status !== "approved" && (
                        <button onClick={() => setStatus(listing._id, "approved")} className="p-1.5 rounded-md text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors" title="Approve"><CheckCircle className="h-3.5 w-3.5" /></button>
                      )}
                      {listing.status !== "rejected" && listing.status !== "published" && (
                        <button onClick={() => setStatus(listing._id, "rejected")} className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Reject"><XCircle className="h-3.5 w-3.5" /></button>
                      )}
                      <button onClick={() => deleteCard(listing._id)} className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages} · {total} total</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingListing} onOpenChange={(o) => !o && setEditingListing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Listing</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {(["name", "city", "address", "phone", "capacity", "priceRange"] as const).map((key) => (
              <div key={key} className="space-y-1">
                <Label className="text-sm capitalize">{key === "priceRange" ? "Price range" : key}</Label>
                <Input value={String(editForm[key] ?? "")} onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-sm">Description</Label>
              <Textarea rows={3} value={String(editForm.description ?? "")} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingListing(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish confirm */}
      <Dialog open={showPublishConfirm} onOpenChange={setShowPublishConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Publish {selectedIds.size} listings to live site?</DialogTitle></DialogHeader>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>These listings will appear on BookMyFarmhouse immediately and be indexed by Google.</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Only &quot;approved&quot; listings will be published</li>
              <li>Duplicate phone numbers will be skipped</li>
              <li>Each listing gets its own SEO-friendly URL</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishConfirm(false)}>Cancel</Button>
            <Button disabled={bulkWorking} onClick={handlePublish}>
              {bulkWorking ? "Publishing…" : `Publish ${selectedIds.size} listings →`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
