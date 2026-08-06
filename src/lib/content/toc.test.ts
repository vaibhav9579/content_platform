import { describe, expect, it } from "vitest";

import { extractToc, slugifyHeading, addHeadingIds } from "./toc";

describe("slugifyHeading", () => {
  it("lowercases and hyphenates", () => {
    expect(slugifyHeading("Why This Matters")).toBe("why-this-matters");
  });

  it("strips punctuation but keeps word characters", () => {
    expect(slugifyHeading("Step 1: Set up your environment!")).toBe("step-1-set-up-your-environment");
  });
});

describe("addHeadingIds", () => {
  it("adds an id derived from heading text to h2/h3 tags missing one", () => {
    const html = "<h2>Getting Started</h2><p>Body</p><h3>Next Steps</h3>";
    const result = addHeadingIds(html);
    expect(result).toContain('<h2 id="getting-started">Getting Started</h2>');
    expect(result).toContain('<h3 id="next-steps">Next Steps</h3>');
  });

  it("leaves headings that already have an id untouched", () => {
    const html = '<h2 id="custom-id">Getting Started</h2>';
    expect(addHeadingIds(html)).toBe(html);
  });

  it("disambiguates duplicate headings with a numeric suffix", () => {
    const html = "<h2>Overview</h2><h2>Overview</h2>";
    const result = addHeadingIds(html);
    expect(result).toContain('id="overview"');
    expect(result).toContain('id="overview-1"');
  });

  it("strips inline markup from the heading before deriving the id", () => {
    const html = "<h2>The <strong>Real</strong> Cost</h2>";
    const result = addHeadingIds(html);
    expect(result).toContain('id="the-real-cost"');
  });

  it("returns empty input unchanged", () => {
    expect(addHeadingIds("")).toBe("");
  });
});

describe("extractToc", () => {
  it("extracts h2/h3 headings with their ids and levels, ignoring h1/h4", () => {
    const html = [
      "<h1 id='title'>Title</h1>",
      '<h2 id="intro">Introduction</h2>',
      "<p>Some body text.</p>",
      '<h3 id="details">Details</h3>',
      "<h4 id='skip'>Should be skipped</h4>",
    ].join("");

    const toc = extractToc(html);

    expect(toc).toEqual([
      { id: "intro", text: "Introduction", level: 2 },
      { id: "details", text: "Details", level: 3 },
    ]);
  });

  it("skips headings without an id (nothing to link to)", () => {
    const html = "<h2>No id here</h2>";
    expect(extractToc(html)).toEqual([]);
  });

  it("returns an empty array for empty input", () => {
    expect(extractToc("")).toEqual([]);
  });

  it("round-trips with addHeadingIds", () => {
    const original = "<h2>Getting Started</h2><h3>Prerequisites</h3>";
    const withIds = addHeadingIds(original);
    const toc = extractToc(withIds);
    expect(toc).toEqual([
      { id: "getting-started", text: "Getting Started", level: 2 },
      { id: "prerequisites", text: "Prerequisites", level: 3 },
    ]);
  });
});
