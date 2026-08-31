export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Instrutel",
  shortName: "Instrutel",
  description:
    "In-depth articles, tutorials, and guides — written by experts, structured for humans and AI alike.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  logo: "/images/instrutel-logo.png",
  ogImage: "/og-default.png",
  locale: "en_US",
  links: {
    twitter: "https://twitter.com/",
    github: "https://github.com/",
    linkedin: "https://linkedin.com/",
  },
  postsPerPage: 12,
  keywords: [
    "blog",
    "articles",
    "tutorials",
    "guides",
    "engineering",
    "technology",
  ],
} as const;

export const navConfig = {
  main: [
    { title: "Home", href: "/" },
    { title: "Articles", href: "/blog" },
    { title: "Categories", href: "/category" },
    { title: "Authors", href: "/author" },
    { title: "Search", href: "/search" },
  ],
};

export type SiteConfig = typeof siteConfig;
