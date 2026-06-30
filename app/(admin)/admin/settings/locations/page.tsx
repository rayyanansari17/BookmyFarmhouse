"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, MapPin, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { ILocation } from "@/types";

export default function LocationsPage() {
  const [locations, setLocations] = useState<ILocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ city: "", state: "" });
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ILocation | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch("/api/admin/locations");
        const data = await res.json();
        if (data.success) setLocations(data.data);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.city.trim() || !form.state.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: form.city.trim(), state: form.state.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setLocations((prev) => [data.data, ...prev]);
      toast.success("Location added");
      setForm({ city: "", state: "" });
      setAddOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to add location");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (loc: ILocation) => {
    setTogglingId(loc._id);
    try {
      const res = await fetch(`/api/admin/locations/${loc._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !loc.isActive }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setLocations((prev) => prev.map((l) => l._id === loc._id ? { ...l, isActive: !l.isActive } : l));
      toast.success(`Location ${!loc.isActive ? "activated" : "deactivated"}`);
    } catch {
      toast.error("Failed to update location");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/locations/${deleteTarget._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setLocations((prev) => prev.filter((l) => l._id !== deleteTarget._id));
      toast.success("Location deleted");
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete location");
    } finally {
      setDeleting(false);
    }
  };

  const grouped = locations.reduce<Record<string, ILocation[]>>((acc, loc) => {
    if (!acc[loc.state]) acc[loc.state] = [];
    acc[loc.state].push(loc);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Locations</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{locations.length} cities configured</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Location
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : locations.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MapPin className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
            <p className="text-muted-foreground text-sm">No locations configured. Add your first city.</p>
            <Button className="mt-4 gap-2" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Add Location
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([state, locs]) => (
            <div key={state}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">{state}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {locs.map((loc) => (
                  <Card key={loc._id} className={`border-border transition-opacity ${!loc.isActive ? "opacity-60" : ""}`}>
                    <CardContent className="flex items-center justify-between p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{loc.city}</p>
                          <Badge variant={loc.isActive ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0 h-4 mt-0.5">
                            {loc.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={togglingId === loc._id}
                          onClick={() => handleToggle(loc)}
                        >
                          {togglingId === loc._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : loc.isActive ? (
                            <ToggleRight className="h-4 w-4 text-primary" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(loc)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add location dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input
                placeholder="e.g. Mumbai"
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input
                placeholder="e.g. Maharashtra"
                value={form.state}
                onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Add Location
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Location</DialogTitle>
            <DialogDescription>
              Delete <strong>{deleteTarget?.city}, {deleteTarget?.state}</strong>? This will remove it from the dropdown for new listings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
