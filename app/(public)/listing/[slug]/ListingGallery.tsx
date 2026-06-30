"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IPropertyImage } from "@/types";

export function ListingGallery({
  images,
  title,
}: {
  images: IPropertyImage[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images?.length) {
    return (
      <div className="h-80 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground">
        No photos available
      </div>
    );
  }

  const prev = () => setActive((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setActive((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <>
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-80 sm:h-[28rem] rounded-2xl overflow-hidden">
        {/* Main image */}
        <div className="col-span-4 sm:col-span-3 row-span-2 relative group cursor-pointer" onClick={() => setLightbox(true)}>
          <Image
            src={images[active].url}
            alt={title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 640px) 100vw, 75vw"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

          {/* Nav arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full h-8 w-8"
                onClick={(e) => { e.stopPropagation(); prev(); }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full h-8 w-8"
                onClick={(e) => { e.stopPropagation(); next(); }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-3 right-3 gap-1.5 text-xs"
            onClick={(e) => { e.stopPropagation(); setLightbox(true); }}
          >
            <Expand className="h-3.5 w-3.5" />
            View all {images.length} photos
          </Button>
        </div>

        {/* Thumbnails (desktop only) */}
        {images.slice(1, 3).map((img, i) => (
          <div
            key={img.publicId}
            className="hidden sm:block relative cursor-pointer group"
            onClick={() => setActive(i + 1)}
          >
            <Image
              src={img.url}
              alt={`${title} ${i + 2}`}
              fill
              className="object-cover group-hover:opacity-90 transition-opacity"
              sizes="25vw"
            />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <div className="relative max-w-4xl w-full max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-[70vh]">
              <Image
                src={images[active].url}
                alt={title}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
            <div className="flex items-center justify-between mt-4">
              <Button variant="secondary" onClick={prev} disabled={images.length <= 1}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-white text-sm">{active + 1} / {images.length}</span>
              <Button variant="secondary" onClick={next} disabled={images.length <= 1}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            className="absolute top-4 right-4 text-white hover:text-white hover:bg-white/10"
            onClick={() => setLightbox(false)}
          >
            Close ✕
          </Button>
        </div>
      )}
    </>
  );
}
