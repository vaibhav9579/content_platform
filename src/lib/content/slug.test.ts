import { describe, expect, it, vi } from "vitest";

import { slugifyTitle, ensureUniqueSlug } from "./slug";

describe("slugifyTitle", () => {
  it("lowercases and hyphenates a title", () => {
    expect(slugifyTitle("The Complete Guide to Server Components")).toBe(
      "the-complete-guide-to-server-components",
    );
  });

  it("strips punctuation", () => {
    expect(slugifyTitle("What's New in 2026? A Look Back!")).toBe("whats-new-in-2026-a-look-back");
  });

  it("collapses repeated whitespace and trims", () => {
    expect(slugifyTitle("  too    many   spaces  ")).toBe("too-many-spaces");
  });

  it("handles already-hyphenated input idempotently", () => {
    expect(slugifyTitle("already-a-slug")).toBe("already-a-slug");
  });
});

describe("ensureUniqueSlug", () => {
  it("returns the normalized slug when nothing conflicts", async () => {
    const checkExists = vi.fn().mockResolvedValue(false);
    const slug = await ensureUniqueSlug("Hello World", checkExists);
    expect(slug).toBe("hello-world");
    expect(checkExists).toHaveBeenCalledWith("hello-world");
  });

  it("appends -2, -3, ... until it finds a free slug", async () => {
    const taken = new Set(["hello-world", "hello-world-2", "hello-world-3"]);
    const checkExists = vi.fn(async (slug: string) => taken.has(slug));

    const slug = await ensureUniqueSlug("Hello World", checkExists);

    expect(slug).toBe("hello-world-4");
    expect(checkExists).toHaveBeenCalledTimes(4);
  });

  it("short-circuits when the base already matches the current slug being edited", async () => {
    const checkExists = vi.fn().mockResolvedValue(true);
    const slug = await ensureUniqueSlug("Hello World", checkExists, "hello-world");
    expect(slug).toBe("hello-world");
    expect(checkExists).not.toHaveBeenCalled();
  });
});
