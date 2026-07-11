import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connectDB } from "@/lib/db/mongoose";
import Property from "@/lib/db/models/Property.model";
import Location from "@/lib/db/models/Location.model";
import { FarmhouseCard, FarmhouseCardSkeleton } from "@/components/common/FarmhouseCard";
import { JsonLd } from "@/components/common/JsonLd";
import { CityFilters } from "./CityFilters";
import { buildItemListSchema, buildFAQSchema, buildBreadcrumbSchema } from "@/lib/schema";
import type { IProperty } from "@/types";

// Regenerate city pages every 15 minutes
export const revalidate = 900;

// Pre-build all active cities at deploy time
export async function generateStaticParams() {
  try {
    await connectDB();
    const locations = await Location.find({ isActive: true }).select("city").lean();
    return locations.map((l) => ({ city: l.city }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const cityName = city.charAt(0).toUpperCase() + city.slice(1);
  const base = process.env.NEXTAUTH_URL ?? "https://bookmyfarmhouse.app";

  return {
    title: `Farmhouses in ${cityName} — Book the Best Venues | BookMyFarmhouse`,
    description: `Browse top farmhouses in ${cityName} for parties, weddings, and corporate events. Compare prices, view photos, check amenities. Free to inquire — no booking fees.`,
    alternates: {
      canonical: `${base}/farmhouses-in-${city}`,
    },
    openGraph: {
      title: `Farmhouses in ${cityName} | BookMyFarmhouse`,
      description: `Find and book the best farmhouses in ${cityName} for any occasion.`,
      url: `${base}/farmhouses-in-${city}`,
    },
  };
}

export default async function CityHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { city } = await params;
  const sp = await searchParams;

  await connectDB();

  // Verify this city is active in our database
  const location = await Location.findOne({
    city: city.toLowerCase(),
    isActive: true,
  }).lean();
  if (!location) notFound();

  // Build the DB filter from URL search params
  const filter: Record<string, unknown> = {
    "location.city": city.toLowerCase(),
    status: "approved",
    isDeleted: false,
  };

  if (sp.amenities) {
    const amenities = Array.isArray(sp.amenities) ? sp.amenities : [sp.amenities];
    if (amenities.length > 0) filter.amenities = { $all: amenities };
  }

  if (sp.guests) {
    const guests = parseInt(sp.guests as string, 10);
    if (!isNaN(guests)) filter["capacity.max"] = { $gte: guests };
  }

  const properties = await Property.find(filter)
    .sort({ rating: -1, createdAt: -1 })
    .limit(48)
    .lean();

  const cityName = city.charAt(0).toUpperCase() + city.slice(1);
  const base = process.env.NEXTAUTH_URL ?? "https://bookmyfarmhouse.app";

  const priceMin = properties.reduce(
    (min, p) => (p.priceRange?.min && p.priceRange.min < min ? p.priceRange.min : min),
    Infinity
  );
  const priceMax = properties.reduce(
    (max, p) => (p.priceRange?.max && p.priceRange.max > max ? p.priceRange.max : max),
    0
  );

  const faqs = [
    {
      q: `What is the average price of farmhouses in ${cityName}?`,
      a:
        properties.length > 0 && priceMin !== Infinity
          ? `Farmhouses in ${cityName} typically range from ₹${priceMin.toLocaleString("en-IN")} to ₹${priceMax.toLocaleString("en-IN")} per day, depending on capacity and amenities.`
          : `Farmhouse prices in ${cityName} vary by venue size and amenities. Submit an inquiry for exact pricing.`,
    },
    {
      q: `How many guests can a farmhouse in ${cityName} accommodate?`,
      a: `Most farmhouses in ${cityName} accommodate between 50 and 500 guests. Use the "Min Guests" filter above to find venues suited to your group size.`,
    },
    {
      q: `How do I book a farmhouse for an event in ${cityName}?`,
      a: `Browse the listings above, click any farmhouse to view full details and photos, then submit a free inquiry with your event date and guest count. The venue will respond within 24 hours.`,
    },
    {
      q: `Which farmhouses in ${cityName} have a swimming pool?`,
      a: `Use the "Swimming Pool" filter above to see all farmhouses in ${cityName} with a pool. You can also combine filters to find venues with a pool and other amenities.`,
    },
  ];

  const activeAmenities = sp.amenities
    ? Array.isArray(sp.amenities)
      ? sp.amenities
      : [sp.amenities]
    : [];
  const isFiltered = activeAmenities.length > 0 || !!sp.guests;

  return (
    <>
      <JsonLd
        schema={buildBreadcrumbSchema([
          { name: "Home", url: base },
          { name: `Farmhouses in ${cityName}`, url: `${base}/farmhouses-in-${city}` },
        ])}
      />
      <JsonLd schema={buildItemListSchema(properties as unknown as IProperty[], city, base)} />
      <JsonLd schema={buildFAQSchema(faqs)} />

      <div className="pt-16 md:pt-20 min-h-screen bg-background">
        {/* Hero header */}
        <div className="bg-muted/40 border-b border-border py-10 px-4">
          <div className="max-w-7xl mx-auto">
            <nav className="text-xs text-muted-foreground mb-3">
              <a href="/" className="hover:text-primary transition-colors">Home</a>
              <span className="mx-1.5">/</span>
              <span className="text-foreground font-medium">Farmhouses in {cityName}</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Farmhouses in {cityName}
            </h1>
            <p className="text-muted-foreground text-base max-w-2xl">
              {properties.length > 0
                ? `${properties.length} venue${properties.length !== 1 ? "s" : ""} available${isFiltered ? " (filtered)" : ""} — parties, weddings, corporate events, and more.`
                : "New venues being added. Check back soon or explore another city."}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Desktop filter sidebar */}
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="sticky top-24">
                <h3 className="font-semibold text-sm text-foreground mb-4">Filters</h3>
                <Suspense>
                  <CityFilters city={city} />
                </Suspense>
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Mobile filters */}
              <div className="lg:hidden mb-4">
                <Suspense>
                  <CityFilters city={city} />
                </Suspense>
              </div>

              {properties.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-4xl mb-4">🏡</div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">No venues found</h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    {isFiltered
                      ? "Try removing some filters to see more results."
                      : `We're adding venues in ${cityName} soon.`}
                  </p>
                  {isFiltered && (
                    <a
                      href={`/farmhouses-in-${city}`}
                      className="text-sm text-primary underline underline-offset-4"
                    >
                      Clear filters
                    </a>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {(properties as unknown as IProperty[]).map((p, i) => (
                    <FarmhouseCard key={p._id} property={p} index={i} />
                  ))}
                </div>
              )}

              {/* FAQ section — AEO / featured snippet bait */}
              <section className="mt-16 pt-10 border-t border-border">
                <h2 className="text-xl font-bold text-foreground mb-8">
                  Frequently Asked Questions — Farmhouses in {cityName}
                </h2>
                <div className="space-y-7 max-w-2xl">
                  {faqs.map(({ q, a }) => (
                    <div key={q}>
                      <h3 className="font-semibold text-foreground mb-2 text-base">{q}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{a}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
