import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroSection } from "@/components/public/HeroSection";
import { FeaturedSection, FeaturedSectionSkeleton } from "@/components/public/FeaturedSection";
import { WhyChooseUs } from "@/components/public/WhyChooseUs";
import { HowItWorks } from "@/components/public/HowItWorks";
import { CTASection } from "@/components/public/CTASection";
import type { IProperty } from "@/types";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

// Fetch featured properties server-side with 5-minute ISR cache
async function getFeaturedProperties(): Promise<IProperty[]> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/properties?limit=4&sortBy=rating`, {
      next: { revalidate: 300 },
    });
    const data = await res.json();
    return data.success ? data.data : [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featuredProperties = await getFeaturedProperties();

  return (
    <>
      <HeroSection />
      <Suspense fallback={<FeaturedSectionSkeleton />}>
        <FeaturedSection properties={featuredProperties} />
      </Suspense>
      <WhyChooseUs />
      <HowItWorks />
      <CTASection />
    </>
  );
}
