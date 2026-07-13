import type { Metadata } from "next";
import { AdminShellWrapper } from "@/components/admin/AdminShell";
import { PageTransition } from "@/components/common/PageTransition";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShellWrapper>
      <PageTransition>{children}</PageTransition>
    </AdminShellWrapper>
  );
}
