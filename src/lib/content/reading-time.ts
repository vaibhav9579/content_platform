import readingTime from "reading-time";

/** Strips HTML tags for a plain-text word/character count. */
function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function computeReadingStats(html: string) {
  const text = stripHtml(html ?? "");
  const stats = readingTime(text);
  return {
    minutes: Math.max(1, Math.ceil(stats.minutes)),
    words: stats.words,
    text: stats.text,
  };
}

export function computeExcerpt(html: string, maxLength = 220) {
  const text = stripHtml(html ?? "");
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
}

export function computeMetaDescription(html: string, maxLength = 155) {
  return computeExcerpt(html, maxLength);
}
