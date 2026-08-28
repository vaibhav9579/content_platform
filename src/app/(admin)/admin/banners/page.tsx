import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireStaff, canManageAllPosts } from "@/lib/auth";
import { getBanners } from "@/features/banners/actions";
import { BannerManager } from "@/components/admin/banners/banner-manager";

export const metadata: Metadata = { title: "Banners" };

export default async function AdminBannersPage() {
  const user = await requireStaff();
  if (!user || !canManageAllPosts(user.role)) redirect("/admin/dashboard");

  const banners = await getBanners();

  return <BannerManager initialBanners={JSON.parse(JSON.stringify(banners))} />;
}
