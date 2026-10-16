import type { MetadataRoute } from "next";

// Only the vendor and admin portals remain (no public pages), so block all crawlers.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
