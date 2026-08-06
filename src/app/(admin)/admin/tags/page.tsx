import type { Metadata } from "next";

import { getTags } from "@/features/tags/actions";
import { TagManager } from "@/components/admin/tags/tag-manager";

export const metadata: Metadata = { title: "Tags" };

export default async function AdminTagsPage() {
  const tags = await getTags();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tags</h1>
        <p className="text-muted-foreground text-sm">Fine-grained topical labels for discovery and SEO.</p>
      </div>
      <TagManager tags={JSON.parse(JSON.stringify(tags))} />
    </div>
  );
}
