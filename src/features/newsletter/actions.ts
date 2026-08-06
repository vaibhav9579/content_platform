"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { newsletterSubscribeSchema, type NewsletterSubscribeInput } from "@/lib/validations";
import { SubscriberStatus } from "@prisma/client";
import { newsletterRateLimit, getRequestIdentifier } from "@/lib/rate-limit";

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

export async function unsubscribeFromNewsletter(email: string): Promise<ActionResult> {
  await prisma.newsletterSubscriber
    .update({
      where: { email },
      data: { status: SubscriberStatus.UNSUBSCRIBED, unsubscribedAt: new Date() },
    })
    .catch(() => null);
  return { success: true, data: undefined };
}

export async function getSubscribers(status?: SubscriberStatus) {
  const user = await requireStaff();
  if (!user) return [];

  return prisma.newsletterSubscriber.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteSubscriber(id: string): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  await prisma.newsletterSubscriber.delete({ where: { id } });
  revalidatePath("/admin/newsletter");
  return { success: true, data: undefined };
}
