import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  website?: string;
  rating?: number;
  photoUrl?: string;
  types: string[];
  lat?: number;
  lon?: number;
}

const CITY_DISPLAY: Record<string, string> = {
  hyderabad: "Hyderabad",
  bangalore: "Bengaluru",
  mumbai: "Mumbai",
  delhi: "Delhi",
  chennai: "Chennai",
  pune: "Pune",
  kolkata: "Kolkata",
  jaipur: "Jaipur",
  ahmedabad: "Ahmedabad",
  lucknow: "Lucknow",
  noida: "Noida",
  gurgaon: "Gurugram",
  chandigarh: "Chandigarh",
  indore: "Indore",
  bhopal: "Bhopal",
};

// Search terms ordered by how likely they are to return OSM results for India
const KEYWORD_STRATEGIES: Record<string, string[]> = {
  farmhouse:            ["farmhouse", "resort", "farm stay", "villa"],
  "farmhouse for events": ["farmhouse", "resort", "farm stay"],
  "villa for rent":     ["villa", "bungalow", "resort"],
  "event venue":        ["banquet hall", "convention centre", "events venue", "resort"],
  "resort for events":  ["resort", "club resort", "spa resort"],
};

interface NominatimResult {
  place_id: number;
  osm_type: string;
  osm_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address: Record<string, string>;
  extratags?: Record<string, string>;
}

async function fetchNominatim(q: string): Promise<NominatimResult[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "20");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");
  url.searchParams.set("countrycodes", "in");
  url.searchParams.set("dedupe", "1");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "BookMyFarmhouse/1.0 (admin venue scraper; contact@bookmyfarmhouse.app)",
        "Accept-Language": "en",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    return (await res.json()) as NominatimResult[];
  } catch {
    return [];
  }
}

function extractName(r: NominatimResult): string | null {
  // Prefer structured address labels
  const structured =
    r.address?.amenity || r.address?.leisure || r.address?.tourism ||
    r.address?.club || r.address?.building || r.address?.hotel;
  if (structured) return structured;

  // First segment of display_name
  const first = r.display_name.split(",")[0].trim();
  if (first && !/^\d/.test(first) && first.length > 3) return first;
  return null;
}

function buildAddress(r: NominatimResult, fallback: string): string {
  const parts = [
    r.address?.road || r.address?.suburb || r.address?.neighbourhood || r.address?.village,
    r.address?.city || r.address?.town || r.address?.county || fallback,
    r.address?.state,
  ].filter(Boolean);
  return parts.join(", ") || fallback;
}

// POST /api/admin/scraper
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { city, keyword = "farmhouse" } = body as { city: string; keyword?: string };

  if (!city?.trim()) {
    return NextResponse.json({ success: false, error: "City is required" }, { status: 400 });
  }

  const cityLower = city.toLowerCase().trim();
  const cityDisplay = CITY_DISPLAY[cityLower] ?? city;
  const strategies = KEYWORD_STRATEGIES[keyword] ?? [keyword, "resort", "villa"];

  try {
    const seen = new Set<string>();
    const results: PlaceResult[] = [];

    // Try each search strategy sequentially (Nominatim: max 1 req/sec policy)
    for (const term of strategies) {
      if (results.length >= 20) break;

      const items = await fetchNominatim(`${term} ${cityDisplay} India`);

      for (const item of items) {
        if (results.length >= 20) break;
        const name = extractName(item);
        if (!name || seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());

        results.push({
          placeId: `nominatim-${item.osm_type}-${item.osm_id}`,
          name,
          address: buildAddress(item, cityDisplay),
          city: cityLower,
          phone:
            item.extratags?.phone ||
            item.extratags?.["contact:phone"] ||
            item.extratags?.["contact:mobile"],
          website:
            item.extratags?.website ||
            item.extratags?.["contact:website"],
          types: [item.type ?? "establishment"],
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          photoUrl: undefined,
        });
      }

      // Respect Nominatim's 1 req/sec policy between queries
      if (results.length < 20 && strategies.indexOf(term) < strategies.length - 1) {
        await new Promise((r) => setTimeout(r, 1100));
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      total: results.length,
      city,
      source: "openstreetmap",
      // Signal to the frontend when OSM simply has no data for this city
      osmEmpty: results.length === 0,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Search failed";
    console.error("Scraper error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
