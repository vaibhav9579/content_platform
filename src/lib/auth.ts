import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";
import { Role, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Resolves (and lazily provisions) the Postgres `User` row for the currently
 * signed-in Clerk session. Cached per-request so it can be called from many
 * server components/actions without duplicating the round-trip.
 */
export const getCurrentDbUser = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { author: true },
  });
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.primaryEmailAddress?.emailAddress ?? `${userId}@unknown.local`;
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  // ADMIN_EMAILS is the bootstrap override for the very first owner account.
  // Otherwise, an admin may have pre-assigned a role to this email via the
  // Team page before the person ever signed in — consume that invite now.
  const isBootstrapAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
  const invite = isBootstrapAdmin
    ? null
    : await prisma.teamInvite.findUnique({ where: { email: email.toLowerCase() } });
  const role: Role = isBootstrapAdmin ? Role.ADMIN : (invite?.role ?? Role.SUBSCRIBER);

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        clerkId: userId,
        email,
        name,
        imageUrl: clerkUser.imageUrl,
        role,
      },
      include: { author: true },
    });

    if (invite) {
      await tx.teamInvite.delete({ where: { id: invite.id } });
    }

    // Staff need an Author profile to be attributable on posts — provision
    // one automatically so an invited teammate can start writing right away
    // instead of waiting on an admin to create it separately.
    if (isStaffRole(role) && !user.author) {
      const authorName = name || email.split("@")[0];
      const slug = await ensureUniqueAuthorSlug(tx, authorName);
      await tx.author.create({
        data: { userId: user.id, name: authorName, slug, avatarUrl: user.imageUrl },
      });
    }

    return user;
  });

  return prisma.user.findUniqueOrThrow({ where: { id: created.id }, include: { author: true } });
});

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

const STAFF_ROLES: Role[] = [Role.ADMIN, Role.EDITOR, Role.AUTHOR, Role.CONTRIBUTOR];

export function isStaffRole(role?: Role | null) {
  return !!role && STAFF_ROLES.includes(role);
}

export function canPublish(role?: Role | null) {
  return role === Role.ADMIN || role === Role.EDITOR;
}

/** ADMIN/EDITOR have editorial oversight of every post; AUTHOR/CONTRIBUTOR only their own. */
export function canManageAllPosts(role?: Role | null) {
  return role === Role.ADMIN || role === Role.EDITOR;
}

export function canManageSettings(role?: Role | null) {
  return role === Role.ADMIN;
}

/** Throws-free guard: returns the db user only if they hold CMS access. */
export async function requireStaff() {
  const user = await getCurrentDbUser();
  if (!user || !isStaffRole(user.role)) return null;
  return user;
}
