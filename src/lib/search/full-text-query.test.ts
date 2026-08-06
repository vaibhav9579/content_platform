import { describe, expect, it } from "vitest";

import { buildPrefixTsQuery } from "./full-text-query";

describe("buildPrefixTsQuery", () => {
  it("builds a single prefix term for one word", () => {
    expect(buildPrefixTsQuery("security")).toBe("security:*");
  });

  it("joins multiple words with AND", () => {
    expect(buildPrefixTsQuery("web performance")).toBe("web:* & performance:*");
  });

  it("collapses repeated whitespace between words", () => {
    expect(buildPrefixTsQuery("web    performance")).toBe("web:* & performance:*");
  });

  it("returns null for empty or whitespace-only input", () => {
    expect(buildPrefixTsQuery("")).toBeNull();
    expect(buildPrefixTsQuery("   ")).toBeNull();
  });

  it("strips tsquery operator syntax so user input can never inject query operators", () => {
    // A malicious/accidental "&", "|", "!", "(", ")", or quote character
    // must never survive into the query — this is the whole safety
    // property $queryRaw relies on when interpolating the result. Tokens
    // that become empty after stripping (like "--") are dropped entirely.
    expect(buildPrefixTsQuery("foo' OR 1=1 --")).toBe("foo:* & OR:* & 11:*");
  });

  it("drops tokens that become empty after stripping punctuation", () => {
    expect(buildPrefixTsQuery("hello *** world")).toBe("hello:* & world:*");
  });

  it("preserves alphanumeric mixed tokens", () => {
    expect(buildPrefixTsQuery("nextjs16 react19")).toBe("nextjs16:* & react19:*");
  });
});
