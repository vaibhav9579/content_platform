import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireStaff, canPublish } from "@/lib/auth";
import { scopeAuthorId } from "@/lib/content/post-authorization";
import { getAdminPosts, getPostStatusCounts } from "@/features/posts/queries/get-admin-posts";
import { PostTable } from "@/components/admin/posts/post-table";

export const metadata: Metadata = { title: "Posts" };

export default async function AdminPostsPage() {
  const user = await requireStaff();
  if (!user) redirect("/sign-in?redirect_url=/admin/posts");

  const authorId = scopeAuthorId(user);
  const [{ posts, totalCount, totalPages, pageSize }, counts] = await Promise.all([
    getAdminPosts({ authorId }),
    getPostStatusCounts(authorId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Posts</h1>
        <p className="text-muted-foreground text-sm">
          {authorId ? "Every draft and published article you've written." : "Every draft, scheduled, and published article."}
        </p>
      </div>
      <PostTable
        initialPosts={JSON.parse(JSON.stringify(posts))}
        counts={counts}
        initialTotalCount={totalCount}
        initialTotalPages={totalPages}
        pageSize={pageSize}
        canPublish={canPublish(user.role)}
      />
    </div>
  );
}
