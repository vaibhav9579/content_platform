import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireStaff, canManageAllPosts } from "@/lib/auth";
import { getAuthors } from "@/features/authors/actions";
import { AuthorManager } from "@/components/admin/authors/author-manager";

export const metadata: Metadata = { title: "Authors" };

export default async function AdminAuthorsPage({ searchParams }: PageProps<"/admin/authors">) {
  const user = await requireStaff();
  if (!user || !canManageAllPosts(user.role)) redirect("/admin/dashboard");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const { authors, totalCount, totalPages, pageSize } = await getAuthors(page);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Authors</h1>
        <p className="text-muted-foreground text-sm">Manage writer profiles, bios, and social links.</p>
      </div>
      <AuthorManager
        authors={JSON.parse(JSON.stringify(authors))}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
      />
    </div>
  );
}
