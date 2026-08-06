import { redirect } from "next/navigation";

import { getCurrentDbUser } from "@/lib/auth";

// Auth gate lives in the layout (not the page) so `redirect()` fires before
// the route's Suspense boundary starts streaming — see the README note on
// streaming vs. exact status codes for why that placement matters here.
export default async function BookmarksLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in?redirect_url=/bookmarks");

  return children;
}
