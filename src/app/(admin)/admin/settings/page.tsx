import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireStaff, canManageSettings } from "@/lib/auth";
import { getSiteSettings } from "@/features/settings/actions";
import { SettingsForm } from "@/components/admin/settings/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const user = await requireStaff();
  if (!user || !canManageSettings(user.role)) redirect("/admin/dashboard");

  const settings = await getSiteSettings();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">Site identity, SEO defaults, and verification.</p>
      </div>
      <SettingsForm settings={JSON.parse(JSON.stringify(settings))} />
    </div>
  );
}
