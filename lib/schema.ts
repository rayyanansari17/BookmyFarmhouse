import type { IProperty } from "@/types";

// ── LocalBusiness ─────────────────────────────────────────────────────────────
export function buildLocalBusinessSchema(property: IProperty, baseUrl: string) {
  const cityName =
    property.location.city.charAt(0).toUpperCase() + property.location.city.slice(1);

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: property.title,
    description: property.description?.slice(0, 300),
    url: `${baseUrl}/listing/${property.slug}`,
    ...(property.images?.[0]?.url && { image: property.images[0].url }),
    address: {
      "@type": "PostalAddress",
      addressLocality: cityName,
      addressRegion: property.location.state ?? "",
      addressCountry: "IN",
      ...(property.location.address && { streetAddress: property.location.address }),
    },
    // aggregateRating omitted until real review counts are tracked in the model
    ...(property.priceRange?.min && {
      priceRange: `₹${property.priceRange.min.toLocaleString("en-IN")}–₹${property.priceRange.max.toLocaleString("en-IN")}`,
    }),
    ...(property.scrapedPhone && { telephone: property.scrapedPhone }),
  };
}

// ── ItemList (for city hub pages) ─────────────────────────────────────────────
export function buildItemListSchema(
  properties: IProperty[],
  city: string,
  baseUrl: string
) {
  const cityName = city.charAt(0).toUpperCase() + city.slice(1);
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Farmhouses in ${cityName}`,
    description: `Top farmhouses and event venues available for booking in ${cityName}, India`,
    numberOfItems: properties.length,
    itemListElement: properties.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${baseUrl}/listing/${p.slug}`,
      name: p.title,
    })),
  };
}

// ── FAQPage ───────────────────────────────────────────────────────────────────
export function buildFAQSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: a,
      },
    })),
  };
}

// ── Organization ─────────────────────────────────────────────────────────────
export function buildOrganizationSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: "BookMyFarmhouse",
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/logo-light.png`,
    },
    sameAs: [
      "https://x.com/bookfarmhouse",
      "https://www.linkedin.com/company/bookmyfarmhouse/",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-9573109741",
      contactType: "customer support",
      availableLanguage: "English",
    },
  };
}

// ── WebSite (enables sitelinks searchbox) ─────────────────────────────────────
export function buildWebSiteSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: "BookMyFarmhouse",
    publisher: { "@id": `${baseUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/search?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ── BreadcrumbList ────────────────────────────────────────────────────────────
export function buildBreadcrumbSchema(crumbs: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}
