import type { Metadata } from "next";

import { getMedia } from "@/features/media/actions";
import { MediaLibrary } from "@/components/admin/media/media-library";

export const metadata: Metadata = { title: "Media Library" };

export default async function AdminMediaPage() {
  const { media, totalCount, totalPages, pageSize } = await getMedia();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Media Library</h1>
        <p className="text-muted-foreground text-sm">
          Every image uploaded through the editor, optimized and served via Cloudinary.
        </p>
      </div>
      <MediaLibrary
        media={JSON.parse(JSON.stringify(media))}
        initialTotalCount={totalCount}
        initialTotalPages={totalPages}
        pageSize={pageSize}
      />
    </div>
  );
}
