import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { requireStaff, canPublish, canManageAllPosts } from "@/lib/auth";
import { ownsPost } from "@/lib/content/post-authorization";
import {
  getEditorFormData,
  getPostForAdmin,
  getPostRevisions,
} from "@/features/posts/queries/get-post-for-admin";
import { PostEditorShell } from "@/components/admin/posts/post-editor-shell";

export const metadata: Metadata = { title: "Edit Post" };

export default async function EditPostPage({ params }: PageProps<"/admin/posts/[id]/edit">) {
  const { id } = await params;
  const user = await requireStaff();
  if (!user) redirect(`/sign-in?redirect_url=/admin/posts/${id}/edit`);

  const post = await getPostForAdmin(id);
  if (!post) notFound();
  if (!ownsPost(user, post)) redirect("/admin/posts");

  const restricted = !canManageAllPosts(user.role);
  const [formData, revisions] = await Promise.all([
    getEditorFormData(restricted ? user.author?.id : undefined),
    getPostRevisions(id),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Edit Post</h1>
      <PostEditorShell
        mode="edit"
        post={JSON.parse(JSON.stringify(post))}
        formData={JSON.parse(JSON.stringify(formData))}
        revisions={JSON.parse(JSON.stringify(revisions))}
        allowPublish={canPublish(user.role)}
      />
    </div>
  );
}
