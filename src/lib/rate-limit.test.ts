import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createRateLimiter } from "./rate-limit";

// No UPSTASH_REDIS_REST_URL/TOKEN in the test environment, so
// createRateLimiter always exercises the in-memory sliding-window
// fallback here — which is exactly the path most deployments hit in
// local dev.

describe("createRateLimiter (in-memory fallback)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit", async () => {
    const limiter = createRateLimiter("test-basic", 3, "1 m");

    const first = await limiter.check("user-1");
    const second = await limiter.check("user-1");
    const third = await limiter.check("user-1");

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(third.success).toBe(true);
    expect(third.remaining).toBe(0);
  });

  it("blocks the request once the limit is exceeded", async () => {
    const limiter = createRateLimiter("test-block", 2, "1 m");

    await limiter.check("user-2");
    await limiter.check("user-2");
    const blocked = await limiter.check("user-2");

    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("tracks each identifier independently", async () => {
    const limiter = createRateLimiter("test-independent", 1, "1 m");

    const userA = await limiter.check("user-a");
    const userB = await limiter.check("user-b");

    expect(userA.success).toBe(true);
    expect(userB.success).toBe(true);
  });

  it("allows requests again once the window has fully elapsed", async () => {
    const limiter = createRateLimiter("test-window", 1, "1 m");

    const first = await limiter.check("user-3");
    expect(first.success).toBe(true);

    const stillBlocked = await limiter.check("user-3");
    expect(stillBlocked.success).toBe(false);

    vi.advanceTimersByTime(61_000);

    const afterWindow = await limiter.check("user-3");
    expect(afterWindow.success).toBe(true);
  });

  it("uses a sliding window: each hit ages out on its own, not all at once", async () => {
    const limiter = createRateLimiter("test-sliding", 2, "10 s");

    const hitAt0 = await limiter.check("user-4"); // t=0, 1/2 used
    expect(hitAt0.success).toBe(true);

    vi.advanceTimersByTime(5_000); // t=5s
    const hitAt5s = await limiter.check("user-4"); // 2/2 used
    expect(hitAt5s.success).toBe(true);

    const blockedAt5s = await limiter.check("user-4");
    expect(blockedAt5s.success).toBe(false);

    // t=10.001s: the t=0 hit has aged out of the 10s window, freeing one
    // slot. This check succeeds and immediately re-fills that slot.
    vi.advanceTimersByTime(5_001);
    const freedSlotUsed = await limiter.check("user-4");
    expect(freedSlotUsed.success).toBe(true);

    // Still t=10.001s: both remaining hits (t=5s and t=10.001s) are
    // active, so the window is full again — a fixed/bucket limiter would
    // have reset entirely by now, but a sliding window shouldn't.
    const blockedAgain = await limiter.check("user-4");
    expect(blockedAgain.success).toBe(false);

    // t=15.001s: the t=5s hit ages out, freeing a slot once more.
    vi.advanceTimersByTime(5_000);
    const allowedAgain = await limiter.check("user-4");
    expect(allowedAgain.success).toBe(true);
  });
});
