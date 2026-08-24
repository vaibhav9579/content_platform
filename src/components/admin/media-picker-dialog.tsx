"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import { CheckIcon, ImageUpIcon, Loader2Icon } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PaginationBar } from "@/components/ui/pagination";
import { getMedia } from "@/features/media/actions";
import { uploadImage } from "@/lib/image/upload-image";

export type PickedMedia = { url: string; altText: string | null };
type MediaItem = Awaited<ReturnType<typeof getMedia>>["media"][number];

/**
 * Shared "add an image" dialog: upload a fresh file, or pick one already in
 * the Media Library. Used by both the editor's slash-command image insert
 * and any cover-image-style field, so every image entry point in the CMS
 * offers reuse instead of only ever uploading a fresh Cloudinary asset.
 */
export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  folder = "content-platform/posts",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (media: PickedMedia) => void;
  folder?: string;
}) {
  const [items, setItems] = React.useState<MediaItem[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback((nextPage: number) => {
    setLoading(true);
    getMedia({ page: nextPage })
      .then((result) => {
        setItems(result.media);
        setTotalPages(result.totalPages);
        setPage(result.page);
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    // Fetching the library's contents when the dialog opens is a sync from
    // an external system (the server), not state derivable during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) load(1);
  }, [open, load]);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const media = await uploadImage(file, folder);
      onSelect({ url: media.secureUrl, altText: media.altText });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function pick(item: MediaItem) {
    onSelect({ url: item.secureUrl, altText: item.altText });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose an image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2Icon className="animate-spin" /> : <ImageUpIcon />}
            {uploading ? "Uploading…" : "Upload new image"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />

          <div>
            <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
              Or choose from your media library
            </p>
            {loading ? (
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-muted aspect-square animate-pulse rounded-lg" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground py-10 text-center text-sm">No media uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => pick(item)}
                    className="group border-border hover:ring-primary relative aspect-square overflow-hidden rounded-lg border transition-all hover:ring-2"
                  >
                    <Image src={item.secureUrl} alt={item.altText ?? ""} fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                      <CheckIcon className="size-6 text-white" />
                    </div>
                  </button>
                ))}
              </div>
            )}
            <PaginationBar page={page} totalPages={totalPages} onPageChange={load} className="mt-3" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
