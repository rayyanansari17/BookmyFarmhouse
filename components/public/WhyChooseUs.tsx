"use client";

import { Shield, Award, Zap, HeartHandshake } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/lib/motion";

const FEATURES = [
  {
    icon: Shield,
    title: "Verified Venues",
    description:
      "Every listing is reviewed and verified by our team before going live. No surprises on event day.",
  },
  {
    icon: Award,
    title: "Premium Selection",
    description:
      "Curated farmhouses and event spaces rated 4+ stars by real guests, so quality is guaranteed.",
  },
  {
    icon: Zap,
    title: "Instant Connections",
    description:
      "Inquire directly with venue owners and get responses within hours — no middlemen, no delays.",
  },
  {
    icon: HeartHandshake,
    title: "Dedicated Support",
    description:
      "Our team is available 7 days a week to help you find the perfect venue for your celebration.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
        >
          <div className="text-primary text-sm font-semibold mb-2">Why BookMyFarmhouse</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            The Smart Way to Find Venues
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            We&apos;ve made the venue search process simple, transparent, and reliable for both
            event planners and venue owners.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
        >
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <motion.div key={title} variants={fadeUp}>
              <Card className="border-border hover:border-primary/30 hover:shadow-md transition-all duration-300 group h-full">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
