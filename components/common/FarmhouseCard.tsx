"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Users, Star } from "lucide-react";
import { motion } from "framer-motion";
import { InquiryModal } from "@/components/common/InquiryModal";
import { formatCurrency } from "@/lib/utils";
import type { IProperty } from "@/types";

const AMENITY_LABELS: Record<string, string> = {
  pool: "Pool", lawn: "Lawn", parking: "Parking", catering: "Catering",
  dj: "DJ", bonfire: "Bonfire", ac: "AC", wifi: "Wi-Fi",
  security: "Security", generator: "Generator", outdoor_seating: "Outdoor Seating",
  barbeque: "BBQ", cricket_pitch: "Cricket Pitch", indoor_games: "Indoor Games",
  changing_rooms: "Changing Rooms",
};

interface FarmhouseCardProps {
  property: IProperty;
  index?: number;
  onInquire?: (property: IProperty) => void;
}

export function FarmhouseCard({ property, index = 0, onInquire }: FarmhouseCardProps) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  const thumbnail = property.images?.[0]?.url ?? property.externalImageUrls?.[0];
  const isFeatured = (property.rating ?? 0) >= 4;

  return (
    <>
      <motion.div
        onClick={() => router.push(`/listing/${property.slug}`)}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ y: -10, rotateX: 2, rotateY: -2, transition: { duration: 0.2 } }}
        transition={{ duration: 0.4, delay: index * 0.08 }}
        style={{ transformStyle: "preserve-3d" }}
        className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
      >
        {/* Image */}
        <div className="relative h-52 overflow-hidden">
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
            <img
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop"
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          {isFeatured && (
            <div className="absolute top-3 left-3">
              <span className="bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-lg">
                ⭐ Featured
              </span>
            </div>
          )}

          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1">
              <Star size={12} className="text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold text-gray-900">
                {property.rating?.toFixed(1) ?? "New"}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-[#ff914d] transition-colors mb-2">
            {property.title}
          </h3>

          <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-3">
            <MapPin size={13} className="text-[#ff914d] shrink-0" />
            <span className="truncate capitalize">{property.location?.city}</span>
          </div>

          {/* Amenities */}
          {property.amenities?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {property.amenities.slice(0, 3).map((a) => (
                <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">
                  {AMENITY_LABELS[a] || a}
                </span>
              ))}
              {property.amenities.length > 3 && (
                <span className="text-xs text-[#ff914d] font-medium">+{property.amenities.length - 3} more</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-1">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-gray-500">from</span>
                <span className="font-bold text-gray-900 text-base">{formatCurrency(property.priceRange?.min)}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Users size={11} />
                <span>Up to {property.capacity?.max} guests</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onInquire) onInquire(property);
                  else setInquiryOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#ff914d] text-white hover:bg-[#ff7a26] transition-colors"
              >
                Inquire
              </button>
              <Link
                href={`/listing/${property.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:border-[#ff914d] hover:text-[#ff914d] transition-colors"
              >
                Details
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {!onInquire && (
        <InquiryModal
          property={inquiryOpen ? property : null}
          open={inquiryOpen}
          onClose={() => setInquiryOpen(false)}
        />
      )}
    </>
  );
}

export function FarmhouseCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md">
      <div className="h-52 bg-gray-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded-lg w-3/4 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded-lg w-1/2 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded-lg w-20 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded-lg w-16 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded-lg w-16 animate-pulse" />
        </div>
        <div className="h-px bg-gray-100 mt-2" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-6 bg-gray-200 rounded-lg w-24 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded-xl w-16 animate-pulse" />
            <div className="h-8 bg-gray-200 rounded-xl w-16 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
