"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Search, MapPin, Wallet, Users, Sparkles } from "lucide-react";
import type { ILocation } from "@/types";

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const router = useRouter();
  const [form, setForm] = useState({ city: "", budget: "", capacity: "" });
  const [cities, setCities] = useState<ILocation[]>([]);
  const heroRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/locations")
      .then((r) => r.json())
      .then((d) => { if (d.success) setCities(d.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(bgRef.current, {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      if (contentRef.current?.children) {
        gsap.from(contentRef.current.children, {
          y: 60,
          opacity: 0,
          duration: 1.2,
          stagger: 0.2,
          ease: "power4.out",
          delay: 0.2,
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (form.city) params.set("city", form.city);
    if (form.budget) {
      const [min, max] = form.budget.split("-");
      if (min) params.set("priceMin", min);
      if (max) params.set("priceMax", max);
      if (form.budget === "100000+") params.set("priceMin", "100000");
    }
    if (form.capacity) params.set("minGuests", form.capacity);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div ref={bgRef} className="absolute inset-0 scale-110">
        <img
          src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&auto=format&fit=crop&q=80"
          alt="Farmhouse background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      </div>

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{ left: `${10 + i * 15}%`, top: `${20 + i * 10}%` }}
            animate={{ y: [0, -40, 0], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </div>

      {/* Content */}
      <div ref={contentRef} className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8 mt-20">
          <Sparkles size={14} className="text-amber-400" />
          <span className="text-white/90 text-sm font-medium">India&apos;s #1 Farmhouse Discovery Platform</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
          India&apos;s
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300"> Smartest Way</span>
          <br />
          to Find Farmhouses
        </h1>

        {/* Subtitle */}
        <p className="text-white/70 text-lg sm:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
          Find &amp; Book Farmhouses for Parties, Weddings, Corporate Events &amp; Weekend Stays across India
        </p>

        {/* Search Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-6 shadow-2xl">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* City */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <MapPin size={16} className="text-orange-400" />
              </div>
              <select
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                className="w-full pl-9 pr-3 py-3.5 rounded-xl bg-white/90 text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
              >
                <option value="">Select City</option>
                {cities.map((c) => (
                  <option key={c._id} value={c.city}>
                    {c.city.charAt(0).toUpperCase() + c.city.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Budget */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Wallet size={16} className="text-orange-400" />
              </div>
              <select
                value={form.budget}
                onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))}
                className="w-full pl-9 pr-3 py-3.5 rounded-xl bg-white/90 text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
              >
                <option value="">Budget Range</option>
                <option value="0-25000">Under ₹25,000</option>
                <option value="25000-50000">₹25K – ₹50K</option>
                <option value="50000-100000">₹50K – ₹1L</option>
                <option value="100000+">₹1L+</option>
              </select>
            </div>

            {/* Capacity */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Users size={16} className="text-orange-400" />
              </div>
              <select
                value={form.capacity}
                onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
                className="w-full pl-9 pr-3 py-3.5 rounded-xl bg-white/90 text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
              >
                <option value="">Guest Count</option>
                <option value="50">Up to 50</option>
                <option value="100">Up to 100</option>
                <option value="200">Up to 200</option>
                <option value="500">Up to 500</option>
                <option value="500">500+</option>
              </select>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-[#ff914d] hover:bg-[#ff7a26] text-white font-semibold py-3.5 px-6 rounded-xl transition-colors min-h-[50px]"
            >
              <Search size={18} />
              Search
            </button>
          </form>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 mt-12">
          {[
            ["200+", "Premium Venues"],
            ["50+", "Cities Covered"],
            ["10,000+", "Events Hosted"],
            ["4.8★", "Average Rating"],
          ].map(([num, label]) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-black text-white">{num}</div>
              <div className="text-white/60 text-xs">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
