import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";

type SchemaAuthor = {
  name: string;
  slug: string;
  bio?: string | null;
  avatarUrl?: string | null;
  title?: string | null;
  websiteUrl?: string | null;
  twitterUrl?: string | null;
  linkedinUrl?: string | null;
};

type SchemaPost = {
  slug: string;
  title: string;
  excerpt?: string | null;
  metaDescription?: string | null;
  coverImageUrl?: string | null;
  publishedAt?: Date | string | null;
  updatedAtCms?: Date | string | null;
  author: SchemaAuthor;
  category?: { name: string; slug: string } | null;
  tags?: { name: string }[];
  faq?: { question: string; answer: string }[] | null;
  readingTimeMinutes?: number | null;
};

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: siteConfig.name,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/logo.png"),
    },
    sameAs: Object.values(siteConfig.links),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    url: siteConfig.url,
    name: siteConfig.name,
    description: siteConfig.description,
    publisher: { "@id": absoluteUrl("/#organization") },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function authorJsonLd(author: SchemaAuthor) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": absoluteUrl(`/author/${author.slug}#person`),
    name: author.name,
    description: author.bio ?? undefined,
    image: author.avatarUrl ?? undefined,
    jobTitle: author.title ?? undefined,
    url: absoluteUrl(`/author/${author.slug}`),
    sameAs: [author.websiteUrl, author.twitterUrl, author.linkedinUrl].filter(Boolean),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

export function articleJsonLd(post: SchemaPost) {
  const url = absoluteUrl(`/blog/${post.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    image: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    dateModified: post.updatedAtCms ? new Date(post.updatedAtCms).toISOString() : undefined,
    author: {
      "@type": "Person",
      name: post.author.name,
      url: absoluteUrl(`/author/${post.author.slug}`),
    },
    publisher: {
      "@type": "Organization",
      "@id": absoluteUrl("/#organization"),
      name: siteConfig.name,
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo.png") },
    },
    articleSection: post.category?.name,
    keywords: post.tags?.map((t) => t.name).join(", "),
    timeRequired: post.readingTimeMinutes ? `PT${post.readingTimeMinutes}M` : undefined,
  };
}

export function faqJsonLd(faq: { question: string; answer: string }[]) {
  if (!faq?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function postJsonLdGraph(post: SchemaPost) {
  const graph: Record<string, unknown>[] = [
    articleJsonLd(post),
    breadcrumbJsonLd([
      { name: "Home", url: "/" },
      ...(post.category ? [{ name: post.category.name, url: `/category/${post.category.slug}` }] : []),
      { name: post.title, url: `/blog/${post.slug}` },
    ]),
    authorJsonLd(post.author),
  ];
  const faq = faqJsonLd(post.faq ?? []);
  if (faq) graph.push(faq);
  return graph;
}
