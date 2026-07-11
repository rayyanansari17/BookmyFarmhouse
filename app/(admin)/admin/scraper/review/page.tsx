"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  XCircle,
  Pencil,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ArrowLeft,
  AlertTriangle,
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

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  published: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const [listings, setListings] = useState<ScrapedListing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({});
  const [editingListing, setEditingListing] = useState<ScrapedListing | null>(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [bulkWorking, setBulkWorking] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const LIMIT = 24;

  // ── Fetch listings ──────────────────────────────────────────────────────────

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (sourceFilter !== "all") params.set("source", sourceFilter);
    if (cityFilter !== "all") params.set("city", cityFilter);
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("limit", String(LIMIT));

    const res = await fetch(`/api/admin/scraper/scraped?${params}`);
    const data = await res.json();
    if (data.success) {
      setListings(data.data);
      setTotal(data.total);
    }
    setLoading(false);
  }, [statusFilter, sourceFilter, cityFilter, search, page]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  // ── Search debounce ─────────────────────────────────────────────────────────

  const handleSearchChange = (v: string) => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setSearch(v);
      setPage(1);
    }, 300);
  };

  // ── Toast helper ────────────────────────────────────────────────────────────

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Selection ───────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(listings.map((l) => l._id)));
  const clearSelection = () => setSelectedIds(new Set());

  // ── Image navigation ────────────────────────────────────────────────────────

  const prevImage = (id: string, max: number) =>
    setImageIndexes((p) => ({ ...p, [id]: ((p[id] ?? 0) - 1 + max) % max }));
  const nextImage = (id: string, max: number) =>
    setImageIndexes((p) => ({ ...p, [id]: ((p[id] ?? 0) + 1) % max }));

  // ── Bulk actions ────────────────────────────────────────────────────────────

  const bulkAction = async (action: "approve" | "reject") => {
    if (selectedIds.size === 0) return;
    setBulkWorking(true);
    const res = await fetch(`/api/admin/scraper/scraped/bulk-${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`${data.modified} listings ${action}d`);
      clearSelection();
      fetchListings();
    } else {
      showToast(data.error ?? "Failed", false);
    }
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
    if (data.success) {
      showToast(`Published ${data.published}, skipped ${data.skipped}`);
      clearSelection();
      fetchListings();
    } else {
      showToast(data.error ?? "Publish failed", false);
    }
    setBulkWorking(false);
  };

  // ── Single status ───────────────────────────────────────────────────────────

  const setStatus = async (id: string, status: "approved" | "rejected" | "pending") => {
    const res = await fetch(`/api/admin/scraper/scraped/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setListings((prev) => prev.map((l) => (l._id === id ? { ...l, status } : l)));
    }
  };

  const deleteCard = async (id: string) => {
    if (!confirm("Delete this scraped listing?")) return;
    await fetch(`/api/admin/scraper/scraped/${id}`, { method: "DELETE" });
    setListings((prev) => prev.filter((l) => l._id !== id));
    setTotal((t) => t - 1);
  };

  // ── Edit save ───────────────────────────────────────────────────────────────

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
    if (data.success) {
      setListings((prev) =>
        prev.map((l) => (l._id === editingListing._id ? data.data : l))
      );
      setEditingListing(null);
      showToast("Edits saved");
    } else {
      showToast("Save failed", false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium text-white transition-all ${
            toast.ok ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/admin/scraper"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Review Scraped Listings</h1>
            <p className="text-sm text-muted-foreground">
              {total} listing{total !== 1 ? "s" : ""} total
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Status tabs */}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {(["all", "pending", "approved", "rejected", "published"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize ${
                  statusFilter === s
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <Select value={sourceFilter} onValueChange={(v) => { if (v) { setSourceFilter(v); setPage(1); } }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="justdial">JustDial</SelectItem>
              <SelectItem value="sulekha">Sulekha</SelectItem>
              <SelectItem value="wedmegood">WedMeGood</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Search name..."
            className="w-48"
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 bg-muted/80 rounded-xl px-4 py-3 mb-4 flex-wrap">
            <span className="text-sm font-medium text-foreground">
              {selectedIds.size} selected
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearSelection}
              className="text-muted-foreground"
            >
              Clear
            </Button>
            <div className="flex gap-2 ml-auto flex-wrap">
              <Button
                size="sm"
                variant="outline"
                disabled={bulkWorking}
                onClick={() => bulkAction("approve")}
                className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950/30"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={bulkWorking}
                onClick={() => bulkAction("reject")}
                className="text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950/30"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button
                size="sm"
                disabled={bulkWorking}
                onClick={() => setShowPublishConfirm(true)}
              >
                Publish {selectedIds.size} listings →
              </Button>
            </div>
          </div>
        )}

        {/* Select all */}
        {listings.length > 0 && (
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <button onClick={selectAll} className="hover:text-foreground transition-colors">
              Select all on page
            </button>
            <span>·</span>
            <span>{listings.length} shown</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && listings.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No listings found</p>
            <p className="text-sm mt-1">Try changing the filters or import some data first.</p>
          </div>
        )}

        {/* Card grid */}
        {!loading && listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => {
              const idx = imageIndexes[listing._id] ?? 0;
              const imgs = listing.imageUrls ?? [];
              const displayName = (listing.editedData?.name as string) ?? listing.name;
              const displayCity = (listing.editedData?.city as string) ?? listing.city;
              const displayAddr = (listing.editedData?.address as string) ?? listing.address;
              const displayPhone =
                (listing.editedData?.phone as string) ?? listing.phone ?? listing.phones?.[0];

              return (
                <div
                  key={listing._id}
                  className={`relative bg-card border rounded-2xl overflow-hidden shadow-sm transition-shadow hover:shadow-md ${
                    selectedIds.has(listing._id)
                      ? "ring-2 ring-primary border-transparent"
                      : "border-border"
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleSelect(listing._id)}
                    className="absolute top-3 left-3 z-10 w-5 h-5 rounded border-2 bg-white/90 border-gray-300 flex items-center justify-center transition-colors"
                    style={
                      selectedIds.has(listing._id)
                        ? { backgroundColor: "hsl(var(--primary))", borderColor: "hsl(var(--primary))" }
                        : {}
                    }
                  >
                    {selectedIds.has(listing._id) && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L4 7L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  {/* Status pill */}
                  <div className="absolute top-3 right-3 z-10">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[listing.status]}`}>
                      {listing.status}
                    </span>
                  </div>

                  {/* Image */}
                  <div className="relative h-44 bg-muted overflow-hidden">
                    {imgs.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imgs[idx]}
                        alt={displayName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        No image
                      </div>
                    )}

                    {/* Prev/Next image */}
                    {imgs.length > 1 && (
                      <>
                        <button
                          onClick={() => prevImage(listing._id, imgs.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 transition-colors"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => nextImage(listing._id, imgs.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 transition-colors"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full">
                          {idx + 1}/{imgs.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-2">
                    <div className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
                      {displayName}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {displayAddr ? `${displayAddr}, ` : ""}
                        {displayCity.charAt(0).toUpperCase() + displayCity.slice(1)}
                      </span>
                    </div>


                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                        {listing.source}
                      </Badge>
                      <span>
                        {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Amenity chips */}
                    {listing.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {listing.amenities.slice(0, 4).map((a) => (
                          <span
                            key={a}
                            className="text-[10px] bg-muted rounded-full px-2 py-0.5 text-muted-foreground"
                          >
                            {a}
                          </span>
                        ))}
                        {listing.amenities.length > 4 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{listing.amenities.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action row */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => openEdit(listing)}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>

                      {listing.status !== "approved" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30"
                          onClick={() => setStatus(listing._id, "approved")}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                      )}

                      {listing.status !== "rejected" && listing.status !== "published" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => setStatus(listing._id, "rejected")}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      )}

                      <button
                        onClick={() => deleteCard(listing._id)}
                        className="ml-auto text-[11px] text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingListing} onOpenChange={(o) => !o && setEditingListing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {[
              { key: "name", label: "Name", type: "input" },
              { key: "city", label: "City", type: "input" },
              { key: "address", label: "Address", type: "input" },
              { key: "phone", label: "Phone", type: "input" },
              { key: "capacity", label: "Capacity", type: "input" },
              { key: "priceRange", label: "Price range", type: "input" },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Label className="text-sm">{label}</Label>
                <Input
                  value={String(editForm[key] ?? "")}
                  onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-sm">Description</Label>
              <Textarea
                rows={3}
                value={String(editForm.description ?? "")}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingListing(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish confirm Dialog */}
      <Dialog open={showPublishConfirm} onOpenChange={setShowPublishConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Publish {selectedIds.size} listings?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>These listings will appear on BookMyFarmhouse immediately.</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Shows &quot;Claim this listing&quot; CTA for vendors</li>
              <li>Duplicate phone numbers will be skipped</li>
              <li>Only &quot;approved&quot; listings will be published</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishConfirm(false)}>
              Cancel
            </Button>
            <Button disabled={bulkWorking} onClick={handlePublish}>
              {bulkWorking ? "Publishing…" : `Publish ${selectedIds.size} listings →`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
