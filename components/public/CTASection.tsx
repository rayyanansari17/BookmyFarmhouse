"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Building2 } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 to-orange-700 p-12 text-center"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />

          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Building2 size={32} className="text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Own a Farmhouse?
            </h2>
            <p className="text-orange-100 text-lg mb-8 max-w-xl mx-auto">
              Join 200+ verified vendors on India&apos;s fastest-growing farmhouse marketplace.
              List your property and start receiving qualified leads today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/become-vendor"
                className="inline-flex items-center justify-center gap-2 bg-white text-orange-700 px-8 py-4 rounded-xl font-bold hover:bg-orange-50 transition-colors shadow-lg"
              >
                List Your Farmhouse <ArrowRight size={18} />
              </Link>
              <Link
                href="/vendor/login"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-colors"
              >
                Vendor Login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
