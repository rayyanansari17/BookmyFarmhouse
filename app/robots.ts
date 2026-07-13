import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.SITE_URL ?? "https://bookmyfarmhouse.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/vendor/", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
