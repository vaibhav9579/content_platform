import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireStaff, canPublish, canManageAllPosts } from "@/lib/auth";
import { getEditorFormData } from "@/features/posts/queries/get-post-for-admin";
import { PostEditorShell } from "@/components/admin/posts/post-editor-shell";

export const metadata: Metadata = { title: "New Post" };

export default async function NewPostPage() {
  const user = await requireStaff();
  if (!user) redirect("/sign-in?redirect_url=/admin/posts/new");

  const restricted = !canManageAllPosts(user.role);
  if (restricted && !user.author) {
    redirect("/admin/dashboard");
  }
  const formData = await getEditorFormData(restricted ? user.author?.id : undefined);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">New Post</h1>
      <PostEditorShell
        mode="create"
        formData={JSON.parse(JSON.stringify(formData))}
        allowPublish={canPublish(user.role)}
      />
    </div>
  );
}
