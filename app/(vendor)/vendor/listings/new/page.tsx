"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Upload, X, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { AMENITIES_LIST, EVENT_TYPES } from "@/types";
import { CityCombobox } from "@/components/vendor/CityCombobox";
import { AddressAutocomplete } from "@/components/vendor/AddressAutocomplete";

type FormData = {
  title: string;
  city: string;
  state: string;
  address: string;
  description: string;
  capacityMin: string;
  capacityMax: string;
  priceMin: string;
  priceMax: string;
  amenities: string[];
  eventTypes: string[];
  rules: string;
};

const STEPS = ["Basic Info", "Details", "Images", "Preview"];

export default function AddListingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);

  const [form, setForm] = useState<FormData>({
    title: "",
    city: "",
    state: "",
    address: "",
    description: "",
    capacityMin: "",
    capacityMax: "",
    priceMin: "",
    priceMax: "",
    amenities: [],
    eventTypes: [],
    rules: "",
  });

  const set = (key: keyof FormData, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const toggleArray = (key: "amenities" | "eventTypes", value: string) => {
    setForm((p) => ({
      ...p,
      [key]: p[key].includes(value)
        ? p[key].filter((v) => v !== value)
        : [...p[key], value],
    }));
  };

  const handleGenerateDescription = async () => {
    if (!form.title.trim()) {
      toast.error("Enter a property title first");
      return;
    }
    setGeneratingDesc(true);
    try {
      const res = await fetch("/api/vendor/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          city: form.city,
          state: form.state,
          amenities: form.amenities,
          eventTypes: form.eventTypes,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      set("description", data.description);
      toast.success("Description generated!");
    } catch {
      toast.error("Failed to generate description. Check your Groq API key.");
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;
    const validFiles = Array.from(files).filter((f) => {
      const validType = ["image/jpeg", "image/png", "image/webp"].includes(f.type);
      const validSize = f.size <= 15 * 1024 * 1024;
      if (!validType) toast.error(`${f.name}: Only JPEG, PNG, WebP allowed`);
      if (!validSize) toast.error(`${f.name}: Max 15MB per image`);
      return validType && validSize;
    });
    const remaining = 10 - imageFiles.length;
    const toAdd = validFiles.slice(0, remaining);
    setImageFiles((prev) => [...prev, ...toAdd]);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) =>
        setImagePreviews((prev) => [...prev, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (i: number) => {
    setImageFiles((prev) => prev.filter((_, idx) => idx !== i));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const createListing = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/vendor/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          city: form.city,
          state: form.state,
          address: form.address,
          capacityMin: parseInt(form.capacityMin),
          capacityMax: parseInt(form.capacityMax),
          priceMin: parseInt(form.priceMin),
          priceMax: parseInt(form.priceMax),
          amenities: form.amenities,
          eventTypes: form.eventTypes,
          rules: form.rules,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setCreatedId(data.data._id);
      return data.data._id as string;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create listing");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const uploadImages = async (id: string) => {
    if (imageFiles.length === 0) return;
    setUploadingImages(true);
    try {
      const fd = new FormData();
      imageFiles.forEach((f) => fd.append("images", f));
      const res = await fetch(`/api/vendor/properties/${id}/images`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
    } catch {
      toast.error("Images upload failed — you can add them later from the edit page");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleNext = async () => {
    if (step === 0) {
      if (!form.title || !form.city || !form.description) {
        toast.error("Please fill in all required fields");
        return;
      }
    }
    if (step === 1) {
      if (!form.capacityMin || !form.capacityMax || !form.priceMin || !form.priceMax) {
        toast.error("Please fill in capacity and pricing");
        return;
      }
    }
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    }
  };

  const handleSubmit = async () => {
    const id = createdId ?? await createListing();
    if (!id) return;
    if (imageFiles.length > 0) await uploadImages(id);
    toast.success("🎉 Listing created! It will be reviewed within 24 hours.");
    router.push("/vendor/listings");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Add New Listing</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
        <div className="flex justify-between">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`text-xs font-medium ${i <= step ? "text-primary" : "text-muted-foreground"}`}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-card border border-border rounded-2xl p-6">
        {step === 0 && (
          <div className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <Label>Property Title *</Label>
              <Input
                placeholder="e.g. Green Valley Farmhouse with Pool"
                value={form.title}
                maxLength={100}
                onChange={(e) => set("title", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{form.title.length}/100</p>
            </div>

            {/* City + State */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>City *</Label>
                <CityCombobox
                  value={form.city}
                  onSelect={(city, state) => {
                    setForm((p) => ({ ...p, city, state }));
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Input
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                  placeholder="Auto-filled from city"
                />
              </div>
            </div>

            {/* Address with Google Maps autocomplete */}
            <div className="space-y-1.5">
              <Label>Address (optional)</Label>
              <AddressAutocomplete
                value={form.address}
                onChange={(v) => set("address", v)}
                placeholder="Village / street address — start typing to search"
              />
            </div>

            {/* Description with AI button */}
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe your property — atmosphere, key features, surroundings..."
                rows={5}
                value={form.description}
                maxLength={5000}
                onChange={(e) => set("description", e.target.value)}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{form.description.length}/5000</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateDescription}
                  disabled={generatingDesc}
                  className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-primary hover:border-primary"
                >
                  {generatingDesc
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Sparkles className="h-3 w-3" />
                  }
                  {generatingDesc ? "Generating..." : "Generate with AI"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Min Capacity *</Label>
                <Input type="number" min="1" placeholder="50" value={form.capacityMin} onChange={(e) => set("capacityMin", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Max Capacity *</Label>
                <Input type="number" min="1" placeholder="300" value={form.capacityMax} onChange={(e) => set("capacityMax", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Min Price (₹/day) *</Label>
                <Input type="number" min="0" placeholder="15000" value={form.priceMin} onChange={(e) => set("priceMin", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Max Price (₹/day) *</Label>
                <Input type="number" min="0" placeholder="50000" value={form.priceMax} onChange={(e) => set("priceMax", e.target.value)} />
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
              <Label>Event Types Suitable For</Label>
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
              <Label>Venue Rules (optional)</Label>
              <Textarea
                placeholder="No loud music after 11pm, no outside food allowed, etc."
                rows={3}
                value={form.rules}
                onChange={(e) => set("rules", e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Upload Photos (max 10)</Label>
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to upload or drag & drop</span>
                <span className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP — max 15MB each</span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => handleImageSelect(e.target.files)}
                />
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {i === 0 && (
                      <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                        Cover
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {imageFiles.length}/10 images selected. You can also add images later from the listings page.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Review Your Listing</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Title</span>
                <span className="font-medium text-foreground text-right max-w-xs">{form.title}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium capitalize">{form.city}, {form.state}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Capacity</span>
                <span className="font-medium">{form.capacityMin}–{form.capacityMax} guests</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Price Range</span>
                <span className="font-medium">₹{parseInt(form.priceMin).toLocaleString()} – ₹{parseInt(form.priceMax).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Amenities</span>
                <span className="font-medium text-right">{form.amenities.length > 0 ? form.amenities.join(", ") : "None"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Photos</span>
                <span className="font-medium">{imageFiles.length} selected</span>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-300">
                  <p className="font-semibold mb-1">Review Process</p>
                  <p>Your listing will be reviewed by our team within 24 hours. You&apos;ll be notified once it goes live.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Previous
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={handleNext} className="gap-2">
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={saving || uploadingImages}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            {(saving || uploadingImages) && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Creating..." : uploadingImages ? "Uploading..." : "Submit Listing"}
          </Button>
        )}
      </div>
    </div>
  );
}
