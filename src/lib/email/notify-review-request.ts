import "server-only";

import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/email/resend";
import { reviewRequestEmailHtml } from "@/lib/email/review-request-template";

/**
 * Emails everyone who can publish (admins and editors) when a post is
 * submitted for review. Best-effort: never throws, so a misconfigured or
 * down email provider can't block the submit-for-review action itself.
 */
export async function sendReviewRequestNotification(
  post: { id: string; title: string },
  submitterName: string | null,
) {
  if (!resend) return;

  try {
    const reviewers = await prisma.user.findMany({
      where: { role: { in: [Role.ADMIN, Role.EDITOR] } },
      select: { email: true },
    });
    if (reviewers.length === 0) return;

    await resend.batch.send(
      reviewers.map((r) => ({
        from: EMAIL_FROM,
        to: r.email,
        subject: `Review requested: ${post.title}`,
        html: reviewRequestEmailHtml({ title: post.title, postId: post.id, submitterName }),
      })),
    );
  } catch (err) {
    console.error("sendReviewRequestNotification failed", err);
  }
}
