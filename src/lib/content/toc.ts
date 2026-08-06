export type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

/** Extracts a table of contents from rendered article HTML (h2/h3 with ids). */
export function extractToc(html: string): TocItem[] {
  if (!html) return [];
  const headingRegex = /<h([23])[^>]*id="([^"]+)"[^>]*>(.*?)<\/h\1>/gi;
  const items: TocItem[] = [];
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(html)) !== null) {
    const level = Number(match[1]) as 2 | 3;
    const id = match[2];
    const text = match[3].replace(/<[^>]*>/g, "").trim();
    if (text) items.push({ id, text, level });
  }
  return items;
}

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

/** Injects `id` attributes onto h2/h3 tags that don't already have one. */
export function addHeadingIds(html: string): string {
  if (!html) return html;
  const seen = new Map<string, number>();
  return html.replace(/<h([23])([^>]*)>(.*?)<\/h\1>/gi, (full, level, attrs, inner) => {
    if (/id="/.test(attrs)) return full;
    const text = inner.replace(/<[^>]*>/g, "").trim();
    let id = slugifyHeading(text) || `section-${level}`;
    const count = seen.get(id) ?? 0;
    seen.set(id, count + 1);
    if (count > 0) id = `${id}-${count}`;
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });
}
