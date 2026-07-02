import { AdminShellWrapper } from "@/components/admin/AdminShell";
import { PageTransition } from "@/components/common/PageTransition";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShellWrapper>
      <PageTransition>{children}</PageTransition>
    </AdminShellWrapper>
  );
}
