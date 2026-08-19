import { describe, expect, it } from "vitest";

import { withShareUtm } from "./utm-link";

describe("withShareUtm", () => {
  it("tags an X share with the right source/medium", () => {
    const url = withShareUtm("https://example.com/blog/my-post", "x");
    const params = new URL(url).searchParams;
    expect(params.get("utm_source")).toBe("x");
    expect(params.get("utm_medium")).toBe("social");
    expect(params.get("utm_campaign")).toBe("share");
  });

  it("tags a copied link as direct/referral, not social", () => {
    const url = withShareUtm("https://example.com/blog/my-post", "copy");
    const params = new URL(url).searchParams;
    expect(params.get("utm_source")).toBe("direct");
    expect(params.get("utm_medium")).toBe("referral");
  });

  it("preserves the original path", () => {
    const url = withShareUtm("https://example.com/blog/my-post", "linkedin");
    expect(new URL(url).pathname).toBe("/blog/my-post");
  });

  it("falls back to the raw network name for an unmapped one", () => {
    const url = withShareUtm("https://example.com/blog/my-post", "mastodon");
    expect(new URL(url).searchParams.get("utm_source")).toBe("mastodon");
  });
});
