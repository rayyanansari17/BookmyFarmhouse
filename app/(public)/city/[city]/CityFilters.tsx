"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const AMENITY_OPTIONS = [
  "Swimming Pool", "Lawn", "Parking", "Catering", "DJ",
  "Bonfire", "Air Conditioning", "Generator", "Wifi", "Bar",
];

const GUEST_OPTIONS = [
  { label: "50+", value: "50" },
  { label: "100+", value: "100" },
  { label: "200+", value: "200" },
  { label: "500+", value: "500" },
];

interface CityFiltersProps {
  city: string;
}

function FilterControls({ city }: CityFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeAmenities = searchParams.getAll("amenities");
  const activeGuests = searchParams.get("guests") ?? "";
  const hasFilters = activeAmenities.length > 0 || activeGuests;

  function buildUrl(updates: { amenities?: string[]; guests?: string }) {
    const params = new URLSearchParams();
    const amenities = updates.amenities ?? activeAmenities;
    const guests = updates.guests !== undefined ? updates.guests : activeGuests;
    amenities.forEach((a) => params.append("amenities", a));
    if (guests) params.set("guests", guests);
    const qs = params.toString();
    return `/farmhouses-in-${city}${qs ? `?${qs}` : ""}`;
  }

  function toggleAmenity(amenity: string) {
    const next = activeAmenities.includes(amenity)
      ? activeAmenities.filter((a) => a !== amenity)
      : [...activeAmenities, amenity];
    router.push(buildUrl({ amenities: next }));
  }

  function setGuests(value: string) {
    router.push(buildUrl({ guests: activeGuests === value ? "" : value }));
  }

  function clearAll() {
    router.push(`/farmhouses-in-${city}`);
  }

  return (
    <div className="space-y-5">
      {hasFilters && (
        <Button variant="ghost" size="sm" className="text-destructive h-7 px-2" onClick={clearAll}>
          <X className="h-3.5 w-3.5 mr-1" /> Clear filters
        </Button>
      )}

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Min Guests
        </p>
        <div className="flex flex-wrap gap-2">
          {GUEST_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setGuests(value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                activeGuests === value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Amenities
        </p>
        <div className="flex flex-wrap gap-1.5">
          {AMENITY_OPTIONS.map((a) => (
            <button
              key={a}
              onClick={() => toggleAmenity(a)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                activeAmenities.includes(a)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CityFilters({ city }: CityFiltersProps) {
  return (
    <>
      {/* Desktop sidebar filters */}
      <div className="hidden lg:block">
        <FilterControls city={city} />
      </div>

      {/* Mobile sheet */}
      <div className="lg:hidden mb-4">
        <Sheet>
          <SheetTrigger className="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterControls city={city} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
