"use server";

import { revalidatePath } from "next/cache";
import { Role, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireStaff, canManageSettings, isStaffRole } from "@/lib/auth";
import { teamInviteInputSchema, type TeamInviteInput } from "@/lib/validations";
import { resend, EMAIL_FROM } from "@/lib/email/resend";
import { teamInviteEmailHtml } from "@/lib/email/team-invite-template";
import { siteConfig } from "@/config/site";

type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

async function sendInviteEmail(to: string, role: Role, invitedByName: string | null) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `You've been added to the ${siteConfig.name} team`,
      html: teamInviteEmailHtml({ role, invitedByName }),
    });
  } catch (err) {
    // Best-effort — the invite itself is already saved, so a flaky email
    // provider shouldn't block granting access.
    console.error("sendInviteEmail failed", err);
  }
}

async function ensureUniqueAuthorSlug(tx: Prisma.TransactionClient, name: string): Promise<string> {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "author";
  let candidate = base;
  let suffix = 2;
  while (await tx.author.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

/** Applies a role to an existing User inside a transaction, provisioning an Author profile if needed. */
async function applyRole(tx: Prisma.TransactionClient, target: { id: string; name: string | null; email: string; imageUrl: string | null; author: { id: string } | null }, role: Role) {
  await tx.user.update({ where: { id: target.id }, data: { role } });
  if (isStaffRole(role) && !target.author) {
    const authorName = target.name || target.email.split("@")[0];
    const slug = await ensureUniqueAuthorSlug(tx, authorName);
    await tx.author.create({ data: { userId: target.id, name: authorName, slug, avatarUrl: target.imageUrl } });
  }
}

export async function getTeamMembers() {
  const user = await requireStaff();
  if (!user || !canManageSettings(user.role)) return { members: [], invites: [] };

  const [members, invites] = await Promise.all([
    prisma.user.findMany({
      where: { role: { not: Role.SUBSCRIBER } },
      include: { author: { select: { id: true, name: true, slug: true, _count: { select: { posts: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.teamInvite.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return { members, invites };
}

/**
 * Grants CMS access to an email address. If that person has already signed
 * in before (they exist as a User, most likely a SUBSCRIBER), the role
 * takes effect immediately. Otherwise it's stored as a pending TeamInvite
 * and consumed automatically the first time they sign in via Clerk.
 */
export async function inviteTeamMember(raw: TeamInviteInput): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };
  if (!canManageSettings(user.role)) return { success: false, error: "Only admins can manage the team." };

  const parsed = teamInviteInputSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  const { email, role } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail }, include: { author: true } });

  if (existing) {
    if (existing.id === user.id) {
      return { success: false, error: "You can't change your own role." };
    }
    await prisma.$transaction(async (tx) => {
      await applyRole(tx, existing, role);
      await tx.teamInvite.deleteMany({ where: { email: normalizedEmail } });
    });
  } else {
    await prisma.teamInvite.upsert({
      where: { email: normalizedEmail },
      update: { role, invitedByEmail: user.email },
      create: { email: normalizedEmail, role, invitedByEmail: user.email },
    });
  }

  await sendInviteEmail(normalizedEmail, role, user.name);
  revalidatePath("/admin/team");
  return { success: true, data: undefined };
}

export async function updateTeamMemberRole(userId: string, role: Role): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };
  if (!canManageSettings(user.role)) return { success: false, error: "Only admins can manage the team." };
  if (userId === user.id) return { success: false, error: "You can't change your own role." };

  const target = await prisma.user.findUnique({ where: { id: userId }, include: { author: true } });
  if (!target) return { success: false, error: "User not found" };

  if (target.role === Role.ADMIN && role !== Role.ADMIN) {
    const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
    if (adminCount <= 1) return { success: false, error: "There must be at least one admin." };
  }

  await prisma.$transaction((tx) => applyRole(tx, target, role));

  revalidatePath("/admin/team");
  return { success: true, data: undefined };
}

/** Revokes CMS access — demotes back to SUBSCRIBER. Their posts and Author profile are kept. */
export async function removeTeamMember(userId: string): Promise<ActionResult> {
  return updateTeamMemberRole(userId, Role.SUBSCRIBER);
}

export async function cancelInvite(inviteId: string): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };
  if (!canManageSettings(user.role)) return { success: false, error: "Only admins can manage the team." };

  await prisma.teamInvite.delete({ where: { id: inviteId } });
  revalidatePath("/admin/team");
  return { success: true, data: undefined };
}
