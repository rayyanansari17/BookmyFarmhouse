"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, X, Upload, Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AMENITIES_LIST, EVENT_TYPES, type ILocation, type IProperty, type IPropertyImage } from "@/types";
import Image from "next/image";
import Link from "next/link";

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cities, setCities] = useState<ILocation[]>([]);
  const [images, setImages] = useState<IPropertyImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    city: "",
    state: "",
    address: "",
    description: "",
    capacityMin: "",
    capacityMax: "",
    priceMin: "",
    priceMax: "",
    amenities: [] as string[],
    eventTypes: [] as string[],
    rules: "",
  });

  useEffect(() => {
    const fetchAll = async () => {
      const [propRes, citiesRes] = await Promise.all([
        fetch(`/api/vendor/properties/${id}`),
        fetch("/api/locations"),
      ]);
      const [propData, citiesData] = await Promise.all([propRes.json(), citiesRes.json()]);
      if (citiesData.success) setCities(citiesData.data);
      if (propData.success) {
        const p: IProperty = propData.data;
        setImages(p.images ?? []);
        setForm({
          title: p.title,
          city: p.location.city,
          state: p.location.state,
          address: p.location.address ?? "",
          description: p.description,
          capacityMin: String(p.capacity ?? ""),
          capacityMax: String(p.capacity ?? ""),
          priceMin: String(p.priceRange.min),
          priceMax: String(p.priceRange.max),
          amenities: p.amenities ?? [],
          eventTypes: p.eventTypes ?? [],
          rules: p.rules ?? "",
        });
      } else {
        toast.error("Listing not found");
        router.push("/vendor/listings");
      }
      setLoading(false);
    };
    fetchAll();
  }, [id, router]);

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const toggleArray = (key: "amenities" | "eventTypes", value: string) => {
    setForm((p) => ({
      ...p,
      [key]: p[key].includes(value) ? p[key].filter((v) => v !== value) : [...p[key], value],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.city || !form.description) {
      toast.error("Title, city and description are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/vendor/properties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          city: form.city,
          state: form.state,
          address: form.address,
          capacityMin: parseInt(form.capacityMin) || 1,
          capacityMax: parseInt(form.capacityMax) || 1,
          priceMin: parseInt(form.priceMin) || 0,
          priceMax: parseInt(form.priceMax) || 0,
          amenities: form.amenities,
          eventTypes: form.eventTypes,
          rules: form.rules,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Listing updated");
      router.push("/vendor/listings");
    } catch (err: any) {
      toast.error(err.message || "Failed to update listing");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = 10 - images.length;
    if (remaining <= 0) { toast.error("Maximum 10 images allowed"); return; }
    const validFiles = Array.from(files).slice(0, remaining).filter((f) => {
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
        toast.error(`${f.name}: Only JPEG, PNG, WebP allowed`);
        return false;
      }
      if (f.size > 15 * 1024 * 1024) { toast.error(`${f.name}: Max 15MB`); return false; }
      return true;
    });
    if (!validFiles.length) return;
    setUploadingImages(true);
    try {
      const fd = new FormData();
      validFiles.forEach((f) => fd.append("images", f));
      const res = await fetch(`/api/vendor/properties/${id}/images`, { method: "POST", body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setImages(data.data);
      toast.success(`${validFiles.length} image${validFiles.length > 1 ? "s" : ""} uploaded`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (publicId: string) => {
    setDeletingImage(publicId);
    try {
      const encodedId = encodeURIComponent(publicId);
      const res = await fetch(`/api/vendor/properties/${id}/images/${encodedId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setImages((prev) => prev.filter((img) => img.publicId !== publicId));
      toast.success("Image removed");
    } catch {
      toast.error("Failed to delete image");
    } finally {
      setDeletingImage(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/vendor/listings">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Listing</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Changes will reset listing to pending review</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic info */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-foreground">Basic Info</h2>

          <div className="space-y-1.5">
            <Label>Property Title *</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Green Valley Farmhouse with Pool" />
            <p className="text-xs text-muted-foreground">{form.title.length}/100</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>City *</Label>
              <Select value={form.city} onValueChange={(v) => {
                if (!v) return;
                set("city", v);
                const loc = cities.find((c) => c.city === v);
                if (loc) set("state", loc.state);
              }}>
                <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c._id} value={c.city}>
                      {c.city.charAt(0).toUpperCase() + c.city.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="Maharashtra" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Address (optional)</Label>
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Village / street address" />
          </div>

          <div className="space-y-1.5">
            <Label>Description *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe your property..."
              rows={5}
            />
          </div>
        </div>

        {/* Details */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-foreground">Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Min Capacity</Label>
              <Input type="number" min="1" value={form.capacityMin} onChange={(e) => set("capacityMin", e.target.value)} placeholder="50" />
            </div>
            <div className="space-y-1.5">
              <Label>Max Capacity</Label>
              <Input type="number" min="1" value={form.capacityMax} onChange={(e) => set("capacityMax", e.target.value)} placeholder="300" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Min Price (₹/day)</Label>
              <Input type="number" min="0" value={form.priceMin} onChange={(e) => set("priceMin", e.target.value)} placeholder="15000" />
            </div>
            <div className="space-y-1.5">
              <Label>Max Price (₹/day)</Label>
              <Input type="number" min="0" value={form.priceMax} onChange={(e) => set("priceMax", e.target.value)} placeholder="50000" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Amenities</Label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_LIST.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleArray("amenities", a)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    form.amenities.includes(a)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Event Types</Label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => toggleArray("eventTypes", e)}
                  className={`px-3 py-1.5 rounded-full text-xs border capitalize transition-colors ${
                    form.eventTypes.includes(e)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Venue Rules</Label>
            <Textarea
              value={form.rules}
              onChange={(e) => set("rules", e.target.value)}
              placeholder="No loud music after 11pm, etc."
              rows={3}
            />
          </div>
        </div>

        {/* Images */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Photos ({images.length}/10)</h2>
            <label className={`cursor-pointer ${images.length >= 10 ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                {uploadingImages ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add photos
              </div>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => handleImageUpload(e.target.files)}
                disabled={images.length >= 10 || uploadingImages}
              />
            </label>
          </div>

          {images.length === 0 ? (
            <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-sm text-muted-foreground">Click to upload photos</span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => handleImageUpload(e.target.files)}
              />
            </label>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {images.map((img, i) => (
                <div key={img.publicId} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                  <Image src={img.url} alt={`Photo ${i + 1}`} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(img.publicId)}
                    disabled={deletingImage === img.publicId}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {deletingImage === img.publicId
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <X className="h-3 w-3" />
                    }
                  </button>
                  {i === 0 && (
                    <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                      Cover
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Link href="/vendor/listings">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
