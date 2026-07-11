import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  MapPin, Users, Star, CheckCircle, Shield, Phone, Mail, Building2, ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ListingGallery } from "./ListingGallery";
import { InquiryTrigger } from "./InquiryTrigger";
import { JsonLd } from "@/components/common/JsonLd";
import { buildLocalBusinessSchema, buildBreadcrumbSchema } from "@/lib/schema";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { IProperty, IUser } from "@/types";

async function getProperty(slug: string): Promise<IProperty | null> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/properties/${slug}`, {
      next: { revalidate: 60 },
    });
    const data = await res.json();
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) return { title: "Venue Not Found" };

  const city = property.location.city.charAt(0).toUpperCase() + property.location.city.slice(1);
  const thumbnail = property.images?.[0]?.url;

  return {
    title: `${property.title} — ${city}`,
    description: property.description?.slice(0, 160),
    openGraph: {
      title: property.title,
      description: property.description?.slice(0, 160),
      images: thumbnail ? [{ url: thumbnail, width: 1200, height: 630 }] : [],
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) notFound();

  const vendor = property.vendorId as IUser;
  const city = property.location.city.charAt(0).toUpperCase() + property.location.city.slice(1);
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://bookmyfarmhouse.app";

  return (
    <div className="pt-16 md:pt-20 bg-background min-h-screen">
      <JsonLd schema={buildLocalBusinessSchema(property, baseUrl)} />
      <JsonLd schema={buildBreadcrumbSchema([
        { name: "Home", url: baseUrl },
        { name: `Farmhouses in ${city}`, url: `${baseUrl}/farmhouses-in-${property.location.city}` },
        { name: property.title, url: `${baseUrl}/listing/${property.slug}` },
      ])} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back */}
        <Link
          href="/search"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to search
        </Link>

        {/* Gallery */}
        <ListingGallery images={property.images} title={property.title} />

        {/* Claim banner — only for unclaimed scraped listings */}
        {property.source === "scraped" && !property.claimed && (
          <div className="mt-6 flex items-start gap-4 rounded-xl border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20 p-4">
            <Building2 className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">Is this your venue?</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Claim this listing to manage photos, respond to enquiries, and access leads.
              </p>
            </div>
            <Link
              href={`/become-vendor?claim=${property._id}`}
              className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-orange-500 bg-background px-3 py-1.5 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-50 dark:hover:bg-orange-950/30"
            >
              Claim this listing →
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & location */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{property.title}</h1>
                {property.rating && (
                  <div className="flex items-center gap-1 shrink-0 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-semibold text-sm">{property.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>
                  {(() => {
                    const addr = property.location.address?.trim();
                    const clean = addr && addr !== "[]" && addr !== "null" && /\w/.test(addr) ? addr : null;
                    return clean ? `${clean}, ` : "";
                  })()}
                  {city}
                  {property.location.state ? `, ${property.location.state}` : ""}
                </span>
              </div>
            </div>

            <Separator />

            {/* Key stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <Users className="h-5 w-5 text-primary mx-auto mb-1" />
                <div className="font-semibold text-foreground">{property.capacity.min}–{property.capacity.max}</div>
                <div className="text-xs text-muted-foreground">Guests</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <div className="font-semibold text-foreground text-sm">
                  {formatCurrency(property.priceRange.min)}
                </div>
                <div className="text-xs text-muted-foreground">Starting from</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <Shield className="h-5 w-5 text-primary mx-auto mb-1" />
                <div className="font-semibold text-foreground text-sm">Verified</div>
                <div className="text-xs text-muted-foreground">Venue</div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            {property.description && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">About This Venue</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {property.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event types */}
            {property.eventTypes && property.eventTypes.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">Event Types</h2>
                <div className="flex flex-wrap gap-2">
                  {property.eventTypes.map((type) => (
                    <Badge key={type} variant="secondary" className="capitalize">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Rules */}
            {property.rules && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">Venue Rules</h2>
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                  {property.rules}
                </p>
              </div>
            )}

            <Separator />

            {/* Vendor info */}
            {vendor && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Hosted By</h2>
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={vendor.profileImage} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                      {vendor.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-foreground">{vendor.name}</div>
                    {vendor.businessName && (
                      <div className="text-sm text-muted-foreground">{vendor.businessName}</div>
                    )}
                    {vendor.about && (
                      <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
                        {vendor.about}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky inquiry card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="border border-border rounded-2xl p-6 shadow-lg bg-card">
                <div className="mb-4">
                  <div className="text-sm text-muted-foreground">Starting from</div>
                  <div className="text-3xl font-bold text-primary">
                    {formatCurrency(property.priceRange.min)}
                  </div>
                  {property.priceRange.max > property.priceRange.min && (
                    <div className="text-sm text-muted-foreground">
                      Up to {formatCurrency(property.priceRange.max)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{property.capacity.min}–{property.capacity.max} guests capacity</span>
                </div>

                <InquiryTrigger property={property} />

                <p className="text-center text-xs text-muted-foreground mt-3">
                  Free to inquire · No booking fees
                </p>

                {vendor?.phone && (
                  <div className="mt-4 pt-4 border-t border-border space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      <span>{vendor.phone}</span>
                    </div>
                    {vendor.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 text-primary" />
                        <span className="truncate">{vendor.email}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span>Verified listing · Your inquiry is safe and private</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
