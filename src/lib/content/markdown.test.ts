import { describe, expect, it } from "vitest";

import { htmlToMarkdown, markdownToHtml, parseFrontmatter } from "./markdown";

describe("htmlToMarkdown", () => {
  it("converts headings and inline formatting", () => {
    const html = "<h2>Hello</h2><p>World <strong>bold</strong> and <em>italic</em></p>";
    const md = htmlToMarkdown(html);
    expect(md).toContain("## Hello");
    expect(md).toContain("**bold**");
    expect(md).toContain("_italic_");
  });

  it("converts lists", () => {
    const html = "<ul><li>One</li><li>Two</li></ul>";
    const md = htmlToMarkdown(html);
    expect(md).toContain("-   One");
    expect(md).toContain("-   Two");
  });

  it("prepends YAML frontmatter when provided", () => {
    const md = htmlToMarkdown("<p>Body</p>", { title: "My Post", slug: "my-post" });
    expect(md.startsWith("---\n")).toBe(true);
    expect(md).toContain("title: My Post");
    expect(md).toContain("slug: my-post");
    expect(md).toContain("Body");
  });

  it("handles empty HTML without throwing", () => {
    expect(() => htmlToMarkdown("")).not.toThrow();
  });
});

describe("markdownToHtml", () => {
  it("converts basic markdown to HTML", async () => {
    const html = await markdownToHtml("# Title\n\nSome **bold** text.");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<strong>bold</strong>");
  });

  it("strips frontmatter before converting the body", async () => {
    const markdown = "---\ntitle: My Post\n---\n\n# Heading\n\nBody text.";
    const html = await markdownToHtml(markdown);
    expect(html).not.toContain("title: My Post");
    expect(html).toContain("<h1>Heading</h1>");
  });
});

describe("parseFrontmatter", () => {
  it("splits frontmatter data from body content", () => {
    const { data, content } = parseFrontmatter("---\ntitle: Hello\ntags:\n  - a\n  - b\n---\nBody here");
    expect(data).toEqual({ title: "Hello", tags: ["a", "b"] });
    expect(content.trim()).toBe("Body here");
  });

  it("returns empty data when there is no frontmatter", () => {
    const { data, content } = parseFrontmatter("Just plain content");
    expect(data).toEqual({});
    expect(content).toBe("Just plain content");
  });
});

describe("round-trip", () => {
  it("HTML -> Markdown -> HTML preserves the heading and emphasis", async () => {
    const original = "<h2>Section</h2><p>Some <strong>important</strong> text.</p>";
    const markdown = htmlToMarkdown(original);
    const html = await markdownToHtml(markdown);
    expect(html).toContain("<h2>Section</h2>");
    expect(html).toContain("<strong>important</strong>");
  });
});
