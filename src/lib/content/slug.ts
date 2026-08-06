import slugify from "slugify";

export function slugifyTitle(title: string) {
  return slugify(title, { lower: true, strict: true, trim: true });
}

export async function ensureUniqueSlug(
  base: string,
  checkExists: (slug: string) => Promise<boolean>,
  currentSlug?: string,
) {
  const normalized = slugifyTitle(base);
  if (normalized === currentSlug) return normalized;

  let candidate = normalized;
  let suffix = 2;
  while (await checkExists(candidate)) {
    candidate = `${normalized}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}
