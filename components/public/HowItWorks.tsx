"use client";

import { Search, MessageSquare, PartyPopper } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/lib/motion";

const STEPS = [
  {
    number: "01",
    icon: Search,
    title: "Search & Discover",
    description:
      "Browse hundreds of verified farmhouses and event venues. Filter by city, capacity, amenities, and budget.",
  },
  {
    number: "02",
    icon: MessageSquare,
    title: "Inquire Directly",
    description:
      "Send an inquiry directly to the venue owner. No booking fees, no commissions — you deal directly.",
  },
  {
    number: "03",
    icon: PartyPopper,
    title: "Celebrate in Style",
    description:
      "Confirm your booking and create unforgettable memories at your perfect venue.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
        >
          <div className="text-primary text-sm font-semibold mb-2">Simple Process</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">How It Works</h2>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            From searching to celebrating — we&apos;ve made the entire process effortless.
          </p>
        </motion.div>

        <div className="relative">
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
          >
            {STEPS.map(({ number, icon: Icon, title, description }, i) => (
              <motion.div
                key={number}
                className="flex flex-col items-center text-center relative"
                variants={fadeUp}
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center border-2 border-primary/20">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
