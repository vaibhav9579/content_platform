import type { Metadata } from "next";

import { getAuthors } from "@/features/authors/actions";
import { AuthorManager } from "@/components/admin/authors/author-manager";

export const metadata: Metadata = { title: "Authors" };

export default async function AdminAuthorsPage() {
  const authors = await getAuthors();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Authors</h1>
        <p className="text-muted-foreground text-sm">Manage writer profiles, bios, and social links.</p>
      </div>
      <AuthorManager authors={JSON.parse(JSON.stringify(authors))} />
    </div>
  );
}
