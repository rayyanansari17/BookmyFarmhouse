"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Users, Star, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { scaleIn } from "@/lib/motion";
import { formatCurrency, truncate } from "@/lib/utils";
import type { IProperty } from "@/types";

interface FarmhouseCardProps {
  property: IProperty;
  onInquire?: (property: IProperty) => void;
}

export function FarmhouseCard({ property, onInquire }: FarmhouseCardProps) {
  const [imgError, setImgError] = useState(false);

  const thumbnail = property.images?.[0]?.url;
  const formattedCity =
    property.location.city.charAt(0).toUpperCase() + property.location.city.slice(1);
  const isFeatured = (property.rating ?? 0) >= 4;

  return (
    <motion.div variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}>
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/30">
      {/* Image */}
      <div className="relative h-52 bg-muted overflow-hidden">
        {thumbnail && !imgError ? (
          <Image
            src={thumbnail}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No image available
          </div>
        )}

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {isFeatured && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-primary text-primary-foreground border-0 text-xs font-semibold">
              ★ Featured
            </Badge>
          </div>
        )}

        {property.rating && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{property.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Title & Location */}
        <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
          {truncate(property.title, 50)}
        </h3>
        <div className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
          <MapPin className="h-3 w-3 shrink-0" />
          <span>{formattedCity}</span>
          {property.location.state && (
            <span className="text-muted-foreground/60">, {property.location.state}</span>
          )}
        </div>

        {/* Amenities */}
        {property.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {property.amenities.slice(0, 3).map((amenity) => (
              <Badge key={amenity} variant="secondary" className="text-xs px-2 py-0.5">
                {amenity}
              </Badge>
            ))}
            {property.amenities.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
                +{property.amenities.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Price & Capacity */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-muted-foreground">Starting from</div>
            <div className="font-bold text-primary text-base">
              {formatCurrency(property.priceRange.min)}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>Up to {property.capacity.max} guests</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onInquire && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-primary border-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() => onInquire(property)}
            >
              Inquire
            </Button>
          )}
          <Link href={`/listing/${property.slug}`} className="flex-1">
            <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
              View Details
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}

export function FarmhouseCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-52 w-full rounded-none" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}
