import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroSection } from "@/components/public/HeroSection";
import { FeaturedSection, FeaturedSectionSkeleton } from "@/components/public/FeaturedSection";
import { WhyChooseUs } from "@/components/public/WhyChooseUs";
import { HowItWorks } from "@/components/public/HowItWorks";
import { CTASection } from "@/components/public/CTASection";
import { getFeaturedProperties } from "@/lib/services/property.service";
import type { IProperty } from "@/types";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

// Featured properties are read straight from the database (no self-HTTP call).
// The page itself is revalidated every 5 minutes.
export const revalidate = 300;

async function loadFeaturedProperties(): Promise<IProperty[]> {
  try {
    return await getFeaturedProperties(4);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featuredProperties = await loadFeaturedProperties();

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
