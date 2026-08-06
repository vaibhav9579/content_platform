import { describe, expect, it } from "vitest";

import { cn, formatDate, formatCompactNumber, truncate, absoluteUrl } from "./utils";

describe("cn", () => {
  it("merges class names and resolves Tailwind conflicts (last wins)", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });
});

describe("formatDate", () => {
  it("formats a date as 'Month D, YYYY'", () => {
    expect(formatDate("2026-03-15T00:00:00Z")).toBe("March 15, 2026");
  });

  it("accepts a Date instance", () => {
    expect(formatDate(new Date("2026-01-01T00:00:00Z"))).toBe("January 1, 2026");
  });
});

describe("formatCompactNumber", () => {
  it("leaves small numbers untouched", () => {
    expect(formatCompactNumber(42)).toBe("42");
  });

  it("compacts thousands and millions", () => {
    expect(formatCompactNumber(1500)).toBe("1.5K");
    expect(formatCompactNumber(2_400_000)).toBe("2.4M");
  });
});

describe("truncate", () => {
  it("returns short text unchanged", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates and appends an ellipsis when too long", () => {
    expect(truncate("hello world", 5)).toBe("hello…");
  });

  it("trims trailing whitespace before the ellipsis", () => {
    // "hello  " (7 chars: 5 letters + 2 spaces) is the slice at length 7;
    // trimEnd removes the trailing spaces before the ellipsis is added.
    expect(truncate("hello  world", 7)).toBe("hello…");
  });
});

describe("absoluteUrl", () => {
  it("joins the site URL with a leading-slash path", () => {
    expect(absoluteUrl("/blog/my-post")).toMatch(/\/blog\/my-post$/);
  });

  it("adds a leading slash when the path is missing one", () => {
    const withSlash = absoluteUrl("/blog/my-post");
    const withoutSlash = absoluteUrl("blog/my-post");
    expect(withoutSlash).toBe(withSlash);
  });
});
