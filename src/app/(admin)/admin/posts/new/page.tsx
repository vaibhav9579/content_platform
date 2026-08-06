import type { Metadata } from "next";

import { getEditorFormData } from "@/features/posts/queries/get-post-for-admin";
import { PostEditorShell } from "@/components/admin/posts/post-editor-shell";

export const metadata: Metadata = { title: "New Post" };

export default async function NewPostPage() {
  const formData = await getEditorFormData();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">New Post</h1>
      <PostEditorShell mode="create" formData={JSON.parse(JSON.stringify(formData))} />
    </div>
  );
}
