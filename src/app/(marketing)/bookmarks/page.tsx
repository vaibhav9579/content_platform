import type { Metadata } from "next";
import { BookmarkIcon } from "lucide-react";

import { getUserBookmarks } from "@/features/bookmarks/actions";
import { PostCard } from "@/components/blog/post-card";

export const metadata: Metadata = {
  title: "My Bookmarks",
  robots: { index: false, follow: false },
};

export default async function BookmarksPage() {
  // Auth is enforced in bookmarks/layout.tsx — reaching this component means
  // a signed-in user is guaranteed.
  const posts = await getUserBookmarks();

  return (
    <div className="container-wide py-12">
      <div className="mb-8 flex items-center gap-3">
        <BookmarkIcon className="size-6" />
        <h1 className="font-serif text-3xl font-semibold tracking-tight">My Bookmarks</h1>
      </div>

      {posts.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center">
          You haven&apos;t bookmarked any articles yet. Look for the bookmark icon while reading.
        </p>
      ) : (
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
