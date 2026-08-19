import "server-only";

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

/**
 * Null when no API key is configured (local dev without an email provider
 * set up) — every caller checks for this and no-ops instead of crashing,
 * the same pattern used for the optional Upstash rate limiter.
 */
export const resend = apiKey ? new Resend(apiKey) : null;

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
