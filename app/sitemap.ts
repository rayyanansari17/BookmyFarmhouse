import { MetadataRoute } from "next";
import { connectDB } from "@/lib/db/mongoose";
import Property from "@/lib/db/models/Property.model";
import Location from "@/lib/db/models/Location.model";
import Blog from "@/lib/db/models/Blog.model";

export const revalidate = 3600; // regenerate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL ?? "https://bookmyfarmhouse.app";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/search`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/become-vendor`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  ];

  try {
    await connectDB();

    const [properties, locations, blogs] = await Promise.all([
      Property.find({ status: "approved", isDeleted: false })
        .select("slug updatedAt")
        .lean(),
      Location.find({ isActive: true }).select("city").lean(),
      Blog.find({ status: "published" })
        .select("slug updatedAt publishedAt")
        .lean(),
    ]);

    const cityRoutes: MetadataRoute.Sitemap = locations.map((loc) => ({
      url: `${base}/farmhouses-in-${loc.city}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));

    const listingRoutes: MetadataRoute.Sitemap = properties.map((p) => ({
      url: `${base}/listing/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    const blogRoutes: MetadataRoute.Sitemap = blogs.map((b) => ({
      url: `${base}/blog/${b.slug}`,
      lastModified: new Date((b as { updatedAt?: Date }).updatedAt ?? b.publishedAt ?? new Date()),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...staticRoutes, ...cityRoutes, ...listingRoutes, ...blogRoutes];
  } catch {
    // If DB is unavailable at build time, return static routes only
    return staticRoutes;
  }
}
