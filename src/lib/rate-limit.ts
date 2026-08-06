import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type LimitResult = { success: boolean; remaining: number; resetMs: number };

/**
 * In-memory sliding-window fallback used when no Upstash Redis is
 * configured (local dev, or a single-instance deployment). It is NOT safe
 * across multiple serverless instances — each instance gets its own
 * counters — so production should set UPSTASH_REDIS_REST_URL /
 * UPSTASH_REDIS_REST_TOKEN to get real distributed rate limiting.
 */
class MemoryRatelimit {
  private hits = new Map<string, number[]>();

  constructor(
    private limit: number,
    private windowMs: number,
  ) {}

  limitFn() {
    // Periodically drop stale keys so this map doesn't grow unbounded on a
    // long-lived dev server.
    if (this.hits.size > 5000) this.hits.clear();
  }

  async check(identifier: string): Promise<LimitResult> {
    this.limitFn();
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const timestamps = (this.hits.get(identifier) ?? []).filter((t) => t > windowStart);

    if (timestamps.length >= this.limit) {
      const resetMs = timestamps[0] + this.windowMs - now;
      return { success: false, remaining: 0, resetMs: Math.max(resetMs, 0) };
    }

    timestamps.push(now);
    this.hits.set(identifier, timestamps);
    return { success: true, remaining: this.limit - timestamps.length, resetMs: this.windowMs };
  }
}

const redisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = redisConfigured ? Redis.fromEnv() : null;

/**
 * Creates a named rate limiter with its own budget. Each call site should
 * use a distinct `name` so limits don't bleed into each other.
 */
export function createRateLimiter(name: string, limit: number, window: `${number} ${"s" | "m" | "h"}`) {
  const windowMs = parseWindowMs(window);
  const memory = new MemoryRatelimit(limit, windowMs);
  const distributed = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, window),
        prefix: `ratelimit:${name}`,
      })
    : null;

  return {
    async check(identifier: string): Promise<LimitResult> {
      if (distributed) {
        const result = await distributed.limit(identifier);
        return { success: result.success, remaining: result.remaining, resetMs: result.reset - Date.now() };
      }
      return memory.check(identifier);
    },
  };
}

function parseWindowMs(window: `${number} ${"s" | "m" | "h"}`): number {
  const [amountStr, unit] = window.split(" ");
  const amount = Number(amountStr);
  const multiplier = unit === "s" ? 1000 : unit === "m" ? 60_000 : 3_600_000;
  return amount * multiplier;
}

/** Best-effort caller identity for rate limiting anonymous/public requests. */
export async function getRequestIdentifier() {
  const { headers } = await import("next/headers");
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

export const commentRateLimit = createRateLimiter("comment", 5, "1 m");
export const newsletterRateLimit = createRateLimiter("newsletter", 3, "1 h");
export const uploadRateLimit = createRateLimiter("upload", 30, "1 h");
export const searchRateLimit = createRateLimiter("search", 60, "1 m");
