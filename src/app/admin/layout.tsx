import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("admin");
  return (
    <DashboardShell user={{ name: session.name, email: session.email, role: session.role }}>{children}</DashboardShell>
  );
}
