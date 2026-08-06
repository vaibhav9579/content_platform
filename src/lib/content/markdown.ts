import TurndownService from "turndown";
import { marked } from "marked";
import matter from "gray-matter";

let turndownService: TurndownService | null = null;

function getTurndown() {
  if (!turndownService) {
    turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
    });
    turndownService.addRule("callout", {
      filter: (node) => node.classList?.contains("callout"),
      replacement: (content, node) => {
        const el = node as HTMLElement;
        const type = el.getAttribute("data-type") ?? "note";
        return `\n> [!${type.toUpperCase()}]\n> ${content.trim()}\n`;
      },
    });
  }
  return turndownService;
}

export function htmlToMarkdown(html: string, frontmatter?: Record<string, unknown>) {
  const body = getTurndown().turndown(html ?? "");
  if (!frontmatter) return body;
  return matter.stringify(body, frontmatter);
}

export async function markdownToHtml(markdown: string) {
  const { content } = matter(markdown);
  return marked.parse(content, { async: true, gfm: true, breaks: false });
}

export function parseFrontmatter(markdown: string) {
  const { data, content } = matter(markdown);
  return { data, content };
}
