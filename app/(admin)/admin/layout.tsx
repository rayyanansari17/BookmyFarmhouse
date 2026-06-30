import { AdminShell } from "@/components/admin/AdminShell";
import { PageTransition } from "@/components/common/PageTransition";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell>
      <PageTransition>{children}</PageTransition>
    </AdminShell>
  );
}
