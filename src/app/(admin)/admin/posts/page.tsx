import type { Metadata } from "next";

import { getAdminPosts, getPostStatusCounts } from "@/features/posts/queries/get-admin-posts";
import { PostTable } from "@/components/admin/posts/post-table";

export const metadata: Metadata = { title: "Posts" };

export default async function AdminPostsPage() {
  const [posts, counts] = await Promise.all([getAdminPosts(), getPostStatusCounts()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Posts</h1>
        <p className="text-muted-foreground text-sm">Every draft, scheduled, and published article.</p>
      </div>
      <PostTable initialPosts={JSON.parse(JSON.stringify(posts))} counts={counts} />
    </div>
  );
}
