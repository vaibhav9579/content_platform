"use server";

import { requireStaff } from "@/lib/auth";
import { htmlToMarkdown, markdownToHtml } from "@/lib/content/markdown";

export async function exportPostAsMarkdown(html: string, frontmatter: Record<string, unknown>) {
  const user = await requireStaff();
  if (!user) return { success: false as const, error: "Unauthorized" };

  return { success: true as const, markdown: htmlToMarkdown(html, frontmatter) };
}

export async function importMarkdownAsHtml(markdown: string) {
  const user = await requireStaff();
  if (!user) return { success: false as const, error: "Unauthorized" };

  return { success: true as const, html: await markdownToHtml(markdown) };
}
