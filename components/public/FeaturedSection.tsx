"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import { FarmhouseCard, FarmhouseCardSkeleton } from "@/components/common/FarmhouseCard";
import { InquiryModal } from "@/components/common/InquiryModal";
import type { IProperty } from "@/types";

interface FeaturedSectionProps {
  properties: IProperty[];
}

export function FeaturedSection({ properties }: FeaturedSectionProps) {
  const [inquiryProperty, setInquiryProperty] = useState<IProperty | null>(null);

  if (properties.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
              <TrendingUp size={12} />
              Hand-picked for you
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
              Featured Farmhouses
            </h2>
            <p className="text-gray-500 text-sm mt-2 max-w-sm">
              Top-rated venues across India, available for your next event
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link
              href="/search"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 border border-gray-200 px-5 py-2.5 rounded-xl hover:border-[#ff914d] hover:text-[#ff914d] transition-colors"
            >
              View all listings <ArrowRight size={15} />
            </Link>
          </motion.div>
        </div>

        {/* Grid — 2 cols on tablet, 4 cols on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {properties.slice(0, 4).map((property, i) => (
            <FarmhouseCard
              key={property._id}
              property={property}
              index={i}
              onInquire={setInquiryProperty}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-14"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-[#ff914d] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#ff7a26] transition-colors shadow-lg shadow-orange-200"
          >
            Browse All Farmhouses <ArrowRight size={18} />
          </Link>
          <p className="text-gray-400 text-xs mt-3">500+ venues across India</p>
        </motion.div>
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
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-12">
          <div className="space-y-3">
            <div className="h-6 w-36 bg-gray-100 rounded-full animate-pulse" />
            <div className="h-9 w-64 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => <FarmhouseCardSkeleton key={i} />)}
        </div>
      </div>
    </section>
  );
}
