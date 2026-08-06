import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";
import { Role } from "@prisma/client";

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
  const role: Role = ADMIN_EMAILS.includes(email.toLowerCase()) ? Role.ADMIN : Role.SUBSCRIBER;

  const created = await prisma.user.create({
    data: {
      clerkId: userId,
      email,
      name,
      imageUrl: clerkUser.imageUrl,
      role,
    },
    include: { author: true },
  });

  return created;
});

const STAFF_ROLES: Role[] = [Role.ADMIN, Role.EDITOR, Role.AUTHOR, Role.CONTRIBUTOR];

export function isStaffRole(role?: Role | null) {
  return !!role && STAFF_ROLES.includes(role);
}

export function canPublish(role?: Role | null) {
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
