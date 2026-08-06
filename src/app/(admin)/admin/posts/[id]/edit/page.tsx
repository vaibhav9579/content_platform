import { notFound } from "next/navigation";
import type { Metadata } from "next";

import {
  getEditorFormData,
  getPostForAdmin,
  getPostRevisions,
} from "@/features/posts/queries/get-post-for-admin";
import { PostEditorShell } from "@/components/admin/posts/post-editor-shell";

export const metadata: Metadata = { title: "Edit Post" };

export default async function EditPostPage({ params }: PageProps<"/admin/posts/[id]/edit">) {
  const { id } = await params;
  const [post, formData, revisions] = await Promise.all([
    getPostForAdmin(id),
    getEditorFormData(),
    getPostRevisions(id),
  ]);

  if (!post) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Edit Post</h1>
      <PostEditorShell
        mode="edit"
        post={JSON.parse(JSON.stringify(post))}
        formData={JSON.parse(JSON.stringify(formData))}
        revisions={JSON.parse(JSON.stringify(revisions))}
      />
    </div>
  );
}
