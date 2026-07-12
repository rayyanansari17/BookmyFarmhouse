"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, XCircle, Star, ExternalLink, Building2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { IProperty } from "@/types";

export default function PendingListingsPage() {
  const [listings, setListings] = useState<IProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [ratingDialog, setRatingDialog] = useState<{ id: string; current: number } | null>(null);
  const [pendingRating, setPendingRating] = useState(0);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/properties?status=pending&limit=50");
      const data = await res.json();
      if (data.success) setListings(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleStatus = async (id: string, status: "approved" | "rejected") => {
    setActionLoading(`${id}-${status}`);
    try {
      const res = await fetch(`/api/admin/properties/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setListings((prev) => prev.filter((p) => p._id !== id));
      toast.success(`Listing ${status}`);
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRate = async () => {
    if (!ratingDialog) return;
    setActionLoading(`rate-${ratingDialog.id}`);
    try {
      const res = await fetch(`/api/admin/properties/${ratingDialog.id}/rating`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: pendingRating }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setListings((prev) => prev.map((p) => p._id === ratingDialog.id ? { ...p, rating: pendingRating } : p));
      toast.success("Rating updated");
      setRatingDialog(null);
    } catch {
      toast.error("Failed to update rating");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pending Review</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{listings.length} listing{listings.length !== 1 ? "s" : ""} awaiting review</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : listings.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">All caught up!</h3>
            <p className="text-muted-foreground text-sm">No listings pending review.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => {
            const busy = actionLoading?.startsWith(listing._id) || false;
            return (
              <Card key={listing._id} className="border-border overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex gap-4 p-4">
                    <div className="relative w-28 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                      {listing.images?.[0] ? (
                        <Image src={listing.images[0].url} alt={listing.title} fill className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full"><Building2 className="h-6 w-6 text-muted-foreground" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground text-sm leading-snug">{listing.title}</h3>
                          <p className="text-xs text-muted-foreground capitalize mt-0.5">
                            {listing.location.city}, {listing.location.state}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {listing.priceRange?.min ? `${formatCurrency(listing.priceRange.min)} – ${formatCurrency(listing.priceRange.max)}` : "Price TBD"} · {listing.capacity?.max ? `Up to ${listing.capacity.max}` : "—"} guests
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Submitted {formatDate(listing.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-xs font-medium">{listing.rating ?? 0}/5</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={() => { setRatingDialog({ id: listing._id, current: listing.rating ?? 0 }); setPendingRating(listing.rating ?? 0); }}
                          >
                            Set rating
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{listing.description}</p>
                    </div>
                  </div>
                  <div className="border-t border-border flex items-center justify-between px-4 py-2.5 bg-muted/30">
                    <Link href={`/listing/${listing.slug}`} target="_blank" className="text-xs text-primary flex items-center gap-1 hover:underline">
                      Preview <ExternalLink className="h-3 w-3" />
                    </Link>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-3 text-xs text-red-700 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                        disabled={busy}
                        onClick={() => handleStatus(listing._id, "rejected")}
                      >
                        {actionLoading === `${listing._id}-rejected` ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 px-3 text-xs"
                        disabled={busy}
                        onClick={() => handleStatus(listing._id, "approved")}
                      >
                        {actionLoading === `${listing._id}-approved` ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!ratingDialog} onOpenChange={() => setRatingDialog(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Set Listing Rating</DialogTitle>
          </DialogHeader>
          <div className="flex gap-1.5 py-4 justify-center">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setPendingRating(n)}>
                <Star className={`h-8 w-8 transition-colors ${n <= pendingRating ? "text-amber-400 fill-amber-400" : "text-muted stroke-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRatingDialog(null)}>Cancel</Button>
            <Button onClick={handleRate} disabled={!!actionLoading}>
              {actionLoading?.startsWith("rate") ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
