"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FarmhouseCard, FarmhouseCardSkeleton } from "@/components/common/FarmhouseCard";
import { InquiryModal } from "@/components/common/InquiryModal";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import type { IProperty } from "@/types";

interface FeaturedSectionProps {
  properties: IProperty[];
}

const PER_PAGE = 3;

export function FeaturedSection({ properties }: FeaturedSectionProps) {
  const [page, setPage] = useState(0);
  const [inquiryProperty, setInquiryProperty] = useState<IProperty | null>(null);

  const totalPages = Math.ceil(properties.length / PER_PAGE);
  const visible = properties.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  const prev = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const next = useCallback(() => setPage((p) => Math.min(totalPages - 1, p + 1)), [totalPages]);

  if (properties.length === 0) return null;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex items-start justify-between mb-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
        >
          <div>
            <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-2">
              <Sparkles className="h-4 w-4" />
              <span>Handpicked For You</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Featured Venues
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              Our highest-rated farmhouses and event spaces, loved by thousands of guests.
            </p>
          </div>

          {totalPages > 1 && (
            <div className="flex gap-2 shrink-0 mt-2">
              <Button
                variant="outline"
                size="icon"
                onClick={prev}
                disabled={page === 0}
                className="rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={next}
                disabled={page >= totalPages - 1}
                className="rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((property) => (
            <FarmhouseCard
              key={property._id}
              property={property}
              onInquire={setInquiryProperty}
            />
          ))}
        </div>

        {/* Page dots */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`h-2 rounded-full transition-all ${
                  i === page ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <InquiryModal
        property={inquiryProperty}
        open={!!inquiryProperty}
        onClose={() => setInquiryProperty(null)}
      />
    </section>
  );
}

export function FeaturedSectionSkeleton() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-muted rounded mb-10 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <FarmhouseCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
