import { describe, expect, it } from "vitest";

import { computeReadingStats, computeExcerpt, computeMetaDescription } from "./reading-time";

describe("computeReadingStats", () => {
  it("strips HTML tags before counting words", () => {
    const html = "<p>Hello <strong>world</strong> this is a <em>test</em></p>";
    const stats = computeReadingStats(html);
    expect(stats.words).toBe(6);
  });

  it("always reports at least 1 minute, even for very short content", () => {
    const stats = computeReadingStats("<p>Hi.</p>");
    expect(stats.minutes).toBeGreaterThanOrEqual(1);
  });

  it("rounds up fractional minutes", () => {
    // ~200 words/minute is the reading-time default; 250 words should
    // round up to 2 minutes, not truncate to 1.
    const words = Array.from({ length: 250 }, () => "word").join(" ");
    const stats = computeReadingStats(`<p>${words}</p>`);
    expect(stats.minutes).toBe(2);
    expect(stats.words).toBe(250);
  });

  it("handles empty input without throwing", () => {
    expect(() => computeReadingStats("")).not.toThrow();
    expect(computeReadingStats("").words).toBe(0);
  });
});

describe("computeExcerpt", () => {
  it("returns the full text untouched when shorter than the limit", () => {
    const html = "<p>Short and sweet.</p>";
    expect(computeExcerpt(html, 220)).toBe("Short and sweet.");
  });

  it("truncates long text at a word boundary and appends an ellipsis", () => {
    const html = `<p>${"word ".repeat(100).trim()}</p>`;
    const excerpt = computeExcerpt(html, 50);
    expect(excerpt.length).toBeLessThanOrEqual(51); // 50 + ellipsis char
    expect(excerpt.endsWith("…")).toBe(true);
    expect(excerpt.endsWith(" …")).toBe(false); // no trailing space before the ellipsis
  });

  it("never splits a word in half", () => {
    const html = "<p>supercalifragilisticexpialidocious is a very long word indeed</p>";
    const excerpt = computeExcerpt(html, 20);
    const withoutEllipsis = excerpt.replace(/…$/, "");
    expect(html).toContain(withoutEllipsis.trim());
  });
});

describe("computeMetaDescription", () => {
  it("defaults to a 155-character budget suitable for search snippets", () => {
    const html = `<p>${"word ".repeat(60).trim()}</p>`;
    const description = computeMetaDescription(html);
    expect(description.length).toBeLessThanOrEqual(156);
  });
});
