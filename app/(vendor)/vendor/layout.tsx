import type { Metadata } from "next";
import { VendorShell } from "@/components/vendor/VendorShell";
import { PageTransition } from "@/components/common/PageTransition";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <VendorShell>
      <PageTransition>{children}</PageTransition>
    </VendorShell>
  );
}
