import { describe, expect, it } from "vitest";

import { sectionForField } from "./post-error-section";

describe("sectionForField", () => {
  it("maps SEO fields to the seo accordion", () => {
    expect(sectionForField(["metaTitle"])).toBe("seo");
    expect(sectionForField(["metaDescription"])).toBe("seo");
    expect(sectionForField(["excerpt"])).toBe("seo");
    expect(sectionForField(["canonicalUrl"])).toBe("seo");
    expect(sectionForField(["metaRobots"])).toBe("seo");
  });

  it("maps GEO fields to the geo accordion", () => {
    expect(sectionForField(["summary"])).toBe("geo");
    expect(sectionForField(["keyTakeaways", 0])).toBe("geo");
    expect(sectionForField(["faq", 0, "answer"])).toBe("geo");
    expect(sectionForField(["sources", 0, "url"])).toBe("geo");
  });

  it("returns undefined for fields visible without expanding an accordion", () => {
    expect(sectionForField(["title"])).toBeUndefined();
    expect(sectionForField(["authorId"])).toBeUndefined();
    expect(sectionForField(["slug"])).toBeUndefined();
  });

  it("returns undefined for an empty path", () => {
    expect(sectionForField([])).toBeUndefined();
  });
});
