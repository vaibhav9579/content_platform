const SEO_FIELDS = new Set(["metaTitle", "metaDescription", "excerpt", "canonicalUrl", "metaRobots"]);
const GEO_FIELDS = new Set(["summary", "keyTakeaways", "faq", "sources"]);

/** Which collapsed sidebar accordion a validation-error field lives in, so the UI can auto-open it. */
export function sectionForField(path: readonly PropertyKey[]): "seo" | "geo" | undefined {
  const key = path[0];
  if (typeof key !== "string") return undefined;
  if (SEO_FIELDS.has(key)) return "seo";
  if (GEO_FIELDS.has(key)) return "geo";
  return undefined;
}
