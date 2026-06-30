import { VendorShell } from "@/components/vendor/VendorShell";
import { PageTransition } from "@/components/common/PageTransition";

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <VendorShell>
      <PageTransition>{children}</PageTransition>
    </VendorShell>
  );
}
