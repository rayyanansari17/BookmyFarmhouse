"use client";

import { Search, MessageCircle, PartyPopper } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  {
    step: "01",
    icon: Search,
    title: "Search & Discover",
    description: "Use our smart filters to find farmhouses by location, budget, capacity, and amenities. Browse high-quality photos and detailed descriptions.",
    color: "bg-orange-600",
  },
  {
    step: "02",
    icon: MessageCircle,
    title: "Inquire Directly",
    description: "Found something you love? Click \"Inquire Now\" and fill a simple form. Your details go directly to the venue owner — no middleman fees.",
    color: "bg-blue-600",
  },
  {
    step: "03",
    icon: PartyPopper,
    title: "Celebrate!",
    description: "The vendor contacts you within 24 hours to confirm availability and pricing. Finalize details and you're all set for an unforgettable event.",
    color: "bg-amber-500",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gray-950 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-wider mb-3">Simple Process</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">How It Works</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            From discovery to celebration in three effortless steps. No sign-ups, no credit cards required.
          </p>
        </motion.div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Connector line */}
          <div className="hidden md:block absolute top-14 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 opacity-30" />

          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative text-center"
              >
                <div className="relative inline-block mb-6">
                  <div className={`w-28 h-28 rounded-3xl ${s.color} flex items-center justify-center mx-auto shadow-2xl`}>
                    <Icon size={40} className="text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-800 border-2 border-gray-900 rounded-full flex items-center justify-center">
                    <span className="text-xs font-black text-white">{s.step}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">{s.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
