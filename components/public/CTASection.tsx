"use client";

import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/lib/motion";

export function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <motion.div
        className="relative z-10 max-w-3xl mx-auto text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
      >
        <motion.div variants={fadeUp}>
          <div className="inline-flex items-center gap-2 bg-white/20 text-white rounded-full px-4 py-1.5 text-sm mb-6">
            <Building2 className="h-4 w-4" />
            For Venue Owners
          </div>
        </motion.div>

        <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white mb-4">
          List Your Property &amp; Grow Your Business
        </motion.h2>

        <motion.p variants={fadeUp} className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
          Join 500+ venue owners already using BookMyFarmhouse to connect with thousands of
          event planners every month. Free to list, no hidden fees.
        </motion.p>

        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/vendor/register">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 font-semibold px-8 w-full sm:w-auto"
            >
              List Your Property Free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <Link href="/vendor/login">
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 px-8 w-full sm:w-auto"
            >
              Vendor Login
            </Button>
          </Link>
        </motion.div>

        <motion.p variants={fadeUp} className="text-white/60 text-sm mt-6">
          No credit card required · Free forever for basic listings
        </motion.p>
      </motion.div>
    </section>
  );
}
