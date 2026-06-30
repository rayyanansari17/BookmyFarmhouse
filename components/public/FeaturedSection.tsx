"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { FarmhouseCard, FarmhouseCardSkeleton } from "@/components/common/FarmhouseCard";
import { InquiryModal } from "@/components/common/InquiryModal";
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

  if (properties.length === 0) return null;

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-orange-600 text-sm font-semibold uppercase tracking-wider mb-2">Hand-picked for you</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Featured Farmhouses</h2>
          </motion.div>

          {totalPages > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#ff914d] hover:text-[#ff914d] disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#ff914d] hover:text-[#ff914d] disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Grid */}
        <motion.div
          key={page}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {visible.map((property, i) => (
            <FarmhouseCard
              key={property._id}
              property={property}
              index={i}
              onInquire={setInquiryProperty}
            />
          ))}
        </motion.div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-lg"
          >
            View All Listings <ArrowRight size={18} />
          </Link>
        </div>
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
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-8 w-48 bg-gray-200 rounded mb-12 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <FarmhouseCardSkeleton key={i} />)}
        </div>
      </div>
    </section>
  );
}
