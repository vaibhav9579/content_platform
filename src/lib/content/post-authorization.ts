import type { Role } from "@prisma/client";

import { canManageAllPosts } from "@/lib/auth";

type ScopedUser = { role: Role; author: { id: string } | null };

/** True if the viewer may act on a post they don't own — editorial oversight (ADMIN/EDITOR) only. */
export function ownsPost(user: ScopedUser, post: { authorId: string }) {
  return canManageAllPosts(user.role) || user.author?.id === post.authorId;
}

/**
 * `authorId` filter for list queries: `undefined` for ADMIN/EDITOR (see
 * everything), the viewer's own author id when restricted, or a sentinel
 * that matches nothing if a restricted role somehow has no author profile
 * yet — never falls through to an unfiltered (all-posts) query.
 */
export function scopeAuthorId(user: ScopedUser) {
  if (canManageAllPosts(user.role)) return undefined;
  return user.author?.id ?? "__no-author-profile__";
}
