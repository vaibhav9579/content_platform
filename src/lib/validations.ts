import { z } from "zod";
import { DifficultyLevel, PostStatus } from "@prisma/client";

export const faqItemSchema = z.object({
  question: z.string().min(1, "FAQ question can't be empty").max(300, "FAQ question is too long (max 300 characters)"),
  answer: z.string().min(1, "FAQ answer can't be empty").max(2000, "FAQ answer is too long (max 2000 characters)"),
});

export const sourceItemSchema = z.object({
  label: z.string().min(1, "Source label can't be empty").max(200, "Source label is too long (max 200 characters)"),
  url: z.string().url("Source URL must be a valid URL"),
});

export const postInputSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title is too long (max 200 characters)"),
  subtitle: z.string().max(300, "Subtitle is too long (max 300 characters)").optional().nullable(),
  slug: z
    .string()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, hyphen-separated"),
  contentJson: z.any(),
  contentHtml: z.string().optional().nullable(),
  contentMdx: z.string().optional().nullable(),
  excerpt: z.string().max(500, "Excerpt is too long (max 500 characters)").optional().nullable(),
  metaTitle: z.string().max(70, "Meta title is too long (max 70 characters)").optional().nullable(),
  metaDescription: z
    .string()
    .max(160, "Meta description is too long (max 160 characters)")
    .optional()
    .nullable(),
  canonicalUrl: z
    .string()
    .url("Canonical URL must be a valid URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  metaRobots: z.string().default("index, follow"),
  coverImageUrl: z.string().url().optional().nullable().or(z.literal("")),
  coverImageAlt: z.string().max(200, "Alt text is too long (max 200 characters)").optional().nullable(),
  ogImageUrl: z.string().url().optional().nullable().or(z.literal("")),
  galleryUrls: z.array(z.string().url()).default([]),
  status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT),
  publishedAt: z.coerce.date().optional().nullable(),
  scheduledAt: z.coerce.date().optional().nullable(),
  readingTimeMinutes: z.number().int().positive().optional().nullable(),
  wordCount: z.number().int().nonnegative().optional().nullable(),
  difficulty: z.nativeEnum(DifficultyLevel).optional().nullable(),
  summary: z.string().max(1000, "Summary is too long (max 1000 characters)").optional().nullable(),
  keyTakeaways: z.array(z.string().max(300, "A key takeaway is too long (max 300 characters)")).default([]),
  faq: z.array(faqItemSchema).default([]),
  sources: z.array(sourceItemSchema).default([]),
  isFeatured: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  authorId: z.string().cuid("Select an author"),
  categoryId: z.string().cuid().optional().nullable(),
  tagIds: z.array(z.string().cuid()).default([]),
});
export type PostInput = z.infer<typeof postInputSchema>;

export const categoryInputSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(500).optional().nullable(),
  parentId: z.string().cuid().optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  iconName: z.string().max(60).optional().nullable(),
  metaTitle: z.string().max(70).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const tagInputSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(1).max(60),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(300).optional().nullable(),
});
export type TagInput = z.infer<typeof tagInputSchema>;

export const authorInputSchema = z.object({
  id: z.string().cuid().optional(),
  userId: z.string().cuid().optional().nullable(),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  bio: z.string().max(2000).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable().or(z.literal("")),
  coverUrl: z.string().url().optional().nullable().or(z.literal("")),
  title: z.string().max(120).optional().nullable(),
  experience: z.string().max(2000).optional().nullable(),
  location: z.string().max(120).optional().nullable(),
  websiteUrl: z.string().url().optional().nullable().or(z.literal("")),
  twitterUrl: z.string().url().optional().nullable().or(z.literal("")),
  linkedinUrl: z.string().url().optional().nullable().or(z.literal("")),
  githubUrl: z.string().url().optional().nullable().or(z.literal("")),
  youtubeUrl: z.string().url().optional().nullable().or(z.literal("")),
  isVerified: z.boolean().default(false),
  featured: z.boolean().default(false),
});
export type AuthorInput = z.infer<typeof authorInputSchema>;

export const commentInputSchema = z.object({
  postId: z.string().cuid(),
  body: z.string().min(1, "Comment cannot be empty").max(3000),
  parentId: z.string().cuid().optional().nullable(),
  guestName: z.string().max(80).optional(),
  guestEmail: z.string().email().optional(),
  // Honeypot: a real visitor never sees or fills this field (hidden via
  // CSS, off-screen, and unlabeled for screen readers). Bots that
  // autofill every input on a form will populate it, so any non-empty
  // value here means "reject silently."
  website: z.string().max(200).optional(),
});
export type CommentInput = z.infer<typeof commentInputSchema>;

export const newsletterSubscribeSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  source: z.string().max(60).optional(),
  website: z.string().max(200).optional(), // honeypot — see commentInputSchema
});
export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;

export const siteSettingsSchema = z.object({
  siteName: z.string().min(1).max(100),
  siteDescription: z.string().min(1).max(300),
  siteUrl: z.string().url(),
  logoUrl: z.string().url().optional().nullable().or(z.literal("")),
  faviconUrl: z.string().url().optional().nullable().or(z.literal("")),
  defaultOgImageUrl: z.string().url().optional().nullable().or(z.literal("")),
  twitterHandle: z.string().max(60).optional().nullable(),
  organizationName: z.string().max(120).optional().nullable(),
  organizationLogoUrl: z.string().url().optional().nullable().or(z.literal("")),
  contactEmail: z.string().email().optional().nullable().or(z.literal("")),
  googleSiteVerification: z.string().max(200).optional().nullable(),
  bingSiteVerification: z.string().max(200).optional().nullable(),
});
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
