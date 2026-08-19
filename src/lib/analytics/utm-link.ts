const UTM_SOURCE: Record<string, string> = { x: "x", linkedin: "linkedin", facebook: "facebook", copy: "direct" };

/** Appends UTM params to a URL so traffic from each share button is attributable in analytics. */
export function withShareUtm(url: string, network: string) {
  const u = new URL(url);
  u.searchParams.set("utm_source", UTM_SOURCE[network] ?? network);
  u.searchParams.set("utm_medium", network === "copy" ? "referral" : "social");
  u.searchParams.set("utm_campaign", "share");
  return u.toString();
}
