import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireStaff, canManageAllPosts } from "@/lib/auth";
import { getTags } from "@/features/tags/actions";
import { TagManager } from "@/components/admin/tags/tag-manager";

export const metadata: Metadata = { title: "Tags" };

export default async function AdminTagsPage({ searchParams }: PageProps<"/admin/tags">) {
  const user = await requireStaff();
  if (!user || !canManageAllPosts(user.role)) redirect("/admin/dashboard");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const { tags, totalCount, totalPages, pageSize } = await getTags(page);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tags</h1>
        <p className="text-muted-foreground text-sm">Fine-grained topical labels for discovery and SEO.</p>
      </div>
      <TagManager
        tags={JSON.parse(JSON.stringify(tags))}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
      />
    </div>
  );
}
