"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { FarmhouseCard, FarmhouseCardSkeleton } from "@/components/common/FarmhouseCard";
import { InquiryModal } from "@/components/common/InquiryModal";
import type { IProperty, ILocation } from "@/types";

const AMENITY_OPTIONS = [
  "Swimming Pool", "Lawn", "Parking", "Catering", "DJ",
  "Bonfire", "Air Conditioning", "Generator", "Wifi", "Bar",
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "rating", label: "Top Rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

interface Filters {
  city: string;
  search: string;
  priceMin: string;
  priceMax: string;
  minGuests: string;
  amenities: string[];
  sortBy: string;
}

function FilterPanel({
  filters,
  cities,
  onFiltersChange,
  onReset,
}: {
  filters: Filters;
  cities: ILocation[];
  onFiltersChange: (f: Partial<Filters>) => void;
  onReset: () => void;
}) {
  const activeCount = [
    filters.city && filters.city !== "all",
    filters.priceMin,
    filters.priceMax,
    filters.minGuests,
    filters.amenities.length > 0,
  ].filter(Boolean).length;

  const toggleAmenity = (a: string) => {
    onFiltersChange({
      amenities: filters.amenities.includes(a)
        ? filters.amenities.filter((x) => x !== a)
        : [...filters.amenities, a],
    });
  };

  return (
    <div className="space-y-5">
      {activeCount > 0 && (
        <Button variant="ghost" size="sm" className="text-destructive h-7 px-2" onClick={onReset}>
          <X className="h-3.5 w-3.5 mr-1" /> Clear all ({activeCount})
        </Button>
      )}

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
          City
        </label>
        <Select value={filters.city} onValueChange={(v) => v && onFiltersChange({ city: v })}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c._id} value={c.city}>
                {c.city.charAt(0).toUpperCase() + c.city.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
          Price Range (₹)
        </label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.priceMin}
            onChange={(e) => onFiltersChange({ priceMin: e.target.value })}
            className="h-9"
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.priceMax}
            onChange={(e) => onFiltersChange({ priceMax: e.target.value })}
            className="h-9"
          />
        </div>
      </div>

      <Separator />

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
          Min Guests
        </label>
        <Input
          type="number"
          placeholder="e.g. 50"
          value={filters.minGuests}
          onChange={(e) => onFiltersChange({ minGuests: e.target.value })}
          className="h-9"
        />
      </div>

      <Separator />

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
          Amenities
        </label>
        <div className="flex flex-wrap gap-1.5">
          {AMENITY_OPTIONS.map((a) => (
            <button
              key={a}
              onClick={() => toggleAmenity(a)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filters.amenities.includes(a)
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

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>({
    city: searchParams.get("city") ?? "",
    search: searchParams.get("search") ?? "",
    priceMin: searchParams.get("priceMin") ?? "",
    priceMax: searchParams.get("priceMax") ?? "",
    minGuests: searchParams.get("minGuests") ?? "",
    amenities: searchParams.getAll("amenities"),
    sortBy: searchParams.get("sortBy") ?? "newest",
  });

  const [properties, setProperties] = useState<IProperty[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<ILocation[]>([]);
  const [inquiryProperty, setInquiryProperty] = useState<IProperty | null>(null);

  useEffect(() => {
    fetch("/api/locations")
      .then((r) => r.json())
      .then((d) => { if (d.success) setCities(d.data); })
      .catch(() => {});
  }, []);

  const fetchResults = useCallback(async (f: Filters, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.city && f.city !== "all") params.set("city", f.city);
      if (f.search) params.set("search", f.search);
      if (f.priceMin) params.set("priceMin", f.priceMin);
      if (f.priceMax) params.set("priceMax", f.priceMax);
      if (f.minGuests) params.set("minGuests", f.minGuests);
      f.amenities.forEach((a) => params.append("amenities", a));
      params.set("sortBy", f.sortBy);
      params.set("page", String(page));
      params.set("limit", "9");

      const res = await fetch(`/api/properties?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProperties(data.data);
        setTotal(data.pagination.total);
        setPages(data.pagination.pages);
        setCurrentPage(data.pagination.current);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchResults(filters, 1), 300);
    return () => clearTimeout(timer);
  }, [filters, fetchResults]);

  const updateFilter = (update: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...update }));
  };

  const resetFilters = () => {
    setFilters({ city: "", search: "", priceMin: "", priceMax: "", minGuests: "", amenities: [], sortBy: "newest" });
  };

  return (
    <div className="pt-16 min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search venues..."
              value={filters.search}
              onChange={(e) => updateFilter({ search: e.target.value })}
              className="pl-9 h-9"
            />
          </div>

          {/* Sort */}
          <Select value={filters.sortBy} onValueChange={(v) => v && updateFilter({ sortBy: v })}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Mobile filter button */}
          <Sheet>
            <SheetTrigger className="lg:hidden inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {filters.amenities.length > 0 && (
                <Badge className="h-4 w-4 p-0 text-xs bg-primary">{filters.amenities.length}</Badge>
              )}
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterPanel
                  filters={filters}
                  cities={cities}
                  onFiltersChange={updateFilter}
                  onReset={resetFilters}
                />
              </div>
            </SheetContent>
          </Sheet>

          <div className="ml-auto text-sm text-muted-foreground hidden sm:block">
            {loading ? "Searching..." : `${total} venue${total !== 1 ? "s" : ""} found`}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-8">
          {/* Desktop filter sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-36">
              <h3 className="font-semibold text-sm mb-4">Filters</h3>
              <FilterPanel
                filters={filters}
                cities={cities}
                onFiltersChange={updateFilter}
                onReset={resetFilters}
              />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 9 }).map((_, i) => <FarmhouseCardSkeleton key={i} />)}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-4xl mb-4">🏚️</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No venues found</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Try adjusting your filters or search term
                </p>
                <Button variant="outline" onClick={resetFilters}>Clear filters</Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {properties.map((p) => (
                    <FarmhouseCard key={p._id} property={p} onInquire={setInquiryProperty} />
                  ))}
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => fetchResults(filters, currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4 text-sm text-muted-foreground">
                      Page {currentPage} of {pages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={currentPage >= pages}
                      onClick={() => fetchResults(filters, currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <InquiryModal
        property={inquiryProperty}
        open={!!inquiryProperty}
        onClose={() => setInquiryProperty(null)}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <SearchPageInner />
    </Suspense>
  );
}
