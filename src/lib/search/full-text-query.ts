import "server-only";

/**
 * Builds a prefix-matching Postgres `to_tsquery` string from free-text user
 * input, e.g. "web perf" -> "web:* & perf:*". Each token is stripped down
 * to alphanumerics before being reassembled, so the result can never
 * contain tsquery operator syntax the caller didn't intend — safe to pass
 * straight into `to_tsquery('english', ...)` as a single parameter.
 *
 * Prefix matching (the `:*` suffix) is what makes search-as-you-type work:
 * typing "secur" matches "security" instead of requiring the whole word.
 */
export function buildPrefixTsQuery(input: string): string | null {
  const tokens = input
    .trim()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean);

  if (tokens.length === 0) return null;
  return tokens.map((t) => `${t}:*`).join(" & ");
}
