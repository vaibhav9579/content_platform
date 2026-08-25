"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireStaff, canManageAllPosts } from "@/lib/auth";
import { newsletterSubscribeSchema, type NewsletterSubscribeInput } from "@/lib/validations";
import { SubscriberStatus } from "@prisma/client";
import { newsletterRateLimit, getRequestIdentifier } from "@/lib/rate-limit";
import { resend, EMAIL_FROM } from "@/lib/email/resend";
import { newPostEmailHtml } from "@/lib/email/new-post-template";
import { siteConfig } from "@/config/site";

const RESEND_BATCH_SIZE = 100;

type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

export async function subscribeToNewsletter(raw: NewsletterSubscribeInput): Promise<ActionResult> {
  const parsed = newsletterSubscribeSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid email" };

  // Honeypot tripped — pretend success, do nothing.
  if (parsed.data.website) {
    return { success: true, data: undefined };
  }

  const identifier = await getRequestIdentifier();
  const { success: withinLimit } = await newsletterRateLimit.check(identifier);
  if (!withinLimit) {
    return { success: false, error: "Too many attempts — please try again in a bit." };
  }

  const { email, source } = parsed.data;

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
  if (existing?.status === SubscriberStatus.ACTIVE) {
    return { success: false, error: "You're already subscribed!" };
  }

  await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: { email, source, status: SubscriberStatus.ACTIVE, confirmedAt: new Date() },
    update: { status: SubscriberStatus.ACTIVE, confirmedAt: new Date(), unsubscribedAt: null },
  });

  return { success: true, data: undefined };
}

/**
 * Keyed by the subscriber's unique unsubscribeToken (not their email) so
 * the public unsubscribe link in an email can't be used to unsubscribe an
 * arbitrary address just by guessing it.
 */
export async function unsubscribeFromNewsletter(token: string): Promise<ActionResult> {
  const result = await prisma.newsletterSubscriber
    .update({
      where: { unsubscribeToken: token },
      data: { status: SubscriberStatus.UNSUBSCRIBED, unsubscribedAt: new Date() },
    })
    .catch(() => null);
  if (!result) return { success: false, error: "Invalid or expired unsubscribe link." };
  return { success: true, data: undefined };
}

const PAGE_SIZE = 20;

export async function getSubscribers(status?: SubscriberStatus, page = 1) {
  const user = await requireStaff();
  if (!user || !canManageAllPosts(user.role)) {
    return { subscribers: [], totalCount: 0, activeCount: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 1 };
  }

  const currentPage = Math.max(1, page);
  const where = status ? { status } : undefined;
  const [subscribers, totalCount, activeCount] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.newsletterSubscriber.count({ where }),
    prisma.newsletterSubscriber.count({ where: { status: SubscriberStatus.ACTIVE } }),
  ]);
  return {
    subscribers,
    totalCount,
    activeCount,
    page: currentPage,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
  };
}

/** Unpaginated — backs the "Export CSV" button, which needs every row regardless of the table's current page. */
export async function getAllSubscribersForExport() {
  const user = await requireStaff();
  if (!user || !canManageAllPosts(user.role)) return [];

  return prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
    select: { email: true, status: true, source: true, createdAt: true },
  });
}

export async function deleteSubscriber(id: string): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };
  if (!canManageAllPosts(user.role)) return { success: false, error: "Only editors and admins can manage subscribers." };

  await prisma.newsletterSubscriber.delete({ where: { id } });
  revalidatePath("/admin/newsletter");
  return { success: true, data: undefined };
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

/**
 * Emails every active subscriber when a post goes live. Best-effort: never
 * throws, so a misconfigured or down email provider can't block a publish.
 * Called from savePost the moment publishedAt is first set.
 */
export async function sendNewPostNotification(post: {
  title: string;
  excerpt: string | null;
  slug: string;
  coverImageUrl: string | null;
}) {
  if (!resend) return { sent: 0, reason: "not-configured" as const };

  try {
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { status: SubscriberStatus.ACTIVE },
      select: { email: true, unsubscribeToken: true },
    });
    if (subscribers.length === 0) return { sent: 0, reason: "no-subscribers" as const };

    const excerpt = post.excerpt ?? "Read the full story on the blog.";
    const batches = chunk(subscribers, RESEND_BATCH_SIZE);

    for (const batch of batches) {
      await resend.batch.send(
        batch.map((sub) => ({
          from: EMAIL_FROM,
          to: sub.email,
          subject: `New from ${siteConfig.name}: ${post.title}`,
          html: newPostEmailHtml({
            title: post.title,
            excerpt,
            slug: post.slug,
            coverImageUrl: post.coverImageUrl,
            unsubscribeToken: sub.unsubscribeToken,
          }),
        })),
      );
    }

    return { sent: subscribers.length, reason: "ok" as const };
  } catch (err) {
    console.error("sendNewPostNotification failed", err);
    return { sent: 0, reason: "error" as const };
  }
}
