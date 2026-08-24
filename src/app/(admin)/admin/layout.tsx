import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  if (!user) redirect("/sign-in?redirect_url=/admin/dashboard");

  return <AdminShell user={user}>{children}</AdminShell>;
}
