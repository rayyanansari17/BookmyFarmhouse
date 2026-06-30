"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Users, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, fadeIn, stagger, staggerFast } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ILocation } from "@/types";

const STATS = [
  { value: "200+", label: "Premium Venues" },
  { value: "50+", label: "Cities Covered" },
  { value: "10K+", label: "Events Hosted" },
  { value: "4.8★", label: "Average Rating" },
];

export function HeroSection() {
  const router = useRouter();
  const [cities, setCities] = useState<ILocation[]>([]);
  const [form, setForm] = useState({ city: "", guests: "", budget: "" });

  useEffect(() => {
    fetch("/api/locations")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCities(d.data);
      })
      .catch(() => {});
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (form.city && form.city !== "all") params.set("city", form.city);
    if (form.guests) params.set("minGuests", form.guests);
    if (form.budget) params.set("priceMax", form.budget);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1920&q=80')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/60" />

      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <motion.div
        className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        {/* Badge */}
        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          India&apos;s #1 Farmhouse Booking Platform
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          Find Your Perfect{" "}
          <span className="text-primary">Farmhouse</span>{" "}
          Venue
        </motion.h1>

        <motion.p variants={fadeUp} className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
          Discover handpicked farmhouses, banquet halls, and outdoor venues for weddings,
          birthday parties, corporate events, and more.
        </motion.p>

        {/* Search Card */}
        <motion.div variants={fadeUp} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-6 shadow-2xl max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* City */}
            <div className="flex-1">
              <Select
                value={form.city}
                onValueChange={(v) => v && setForm((prev) => ({ ...prev, city: v }))}
              >
                <SelectTrigger className="h-12 bg-white/90 dark:bg-background border-0 text-foreground">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    <SelectValue placeholder="Select city" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c._id} value={c.city}>
                      {c.city.charAt(0).toUpperCase() + c.city.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Guests */}
            <div className="sm:w-36">
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input
                  type="number"
                  placeholder="Guests"
                  min="1"
                  value={form.guests}
                  onChange={(e) => setForm((prev) => ({ ...prev, guests: e.target.value }))}
                  className="pl-9 h-12 bg-white/90 dark:bg-background border-0"
                />
              </div>
            </div>

            {/* Budget */}
            <div className="sm:w-44">
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input
                  type="number"
                  placeholder="Max budget (₹)"
                  value={form.budget}
                  onChange={(e) => setForm((prev) => ({ ...prev, budget: e.target.value }))}
                  className="pl-9 h-12 bg-white/90 dark:bg-background border-0"
                />
              </div>
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              size="lg"
              className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 max-w-2xl mx-auto"
          variants={staggerFast}
        >
          {STATS.map(({ value, label }) => (
            <motion.div key={label} variants={fadeUp} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white">{value}</div>
              <div className="text-xs sm:text-sm text-white/70 mt-1">{label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/60">
        <span className="text-xs">Scroll to explore</span>
        <div className="w-5 h-8 border-2 border-white/40 rounded-full flex items-start justify-center p-1">
          <div className="w-1 h-2 bg-white/60 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
