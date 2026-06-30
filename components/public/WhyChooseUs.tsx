"use client";

import { Shield, Star, Zap } from "lucide-react";
import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: Shield,
    title: "Verified Venues",
    description: "Every farmhouse goes through a rigorous verification process. We inspect properties personally before listing them on our platform.",
    color: "bg-blue-50 text-blue-600",
    accentColor: "border-blue-200",
  },
  {
    icon: Star,
    title: "Premium Selection",
    description: "Only the finest farmhouses make our cut. We curate the top 10% of venues to ensure you always find exactly what you need.",
    color: "bg-amber-50 text-amber-600",
    accentColor: "border-amber-200",
  },
  {
    icon: Zap,
    title: "Instant Connections",
    description: "Skip the middleman. Your inquiry goes directly to the venue owner and you get a response within 24 hours, always.",
    color: "bg-orange-50 text-orange-600",
    accentColor: "border-orange-200",
  },
];

export function WhyChooseUs() {
  return (
    <section id="why-us" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-orange-600 text-sm font-semibold uppercase tracking-wider mb-3">Why Us</p>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
            The Smarter Way to Find<br />Your Perfect Venue
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            We&apos;re not just a directory. We&apos;re a curated marketplace that connects you directly with the best farmhouse owners in India.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`group p-8 rounded-2xl border-2 ${f.accentColor} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
              >
                <div className={`w-14 h-14 rounded-2xl ${f.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon size={26} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{f.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
