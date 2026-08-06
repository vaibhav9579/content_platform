"use client";

import * as React from "react";
import Image from "next/image";
import { useTransition } from "react";
import { toast } from "sonner";
import { CheckIcon, CopyIcon, Loader2Icon, RotateCcwIcon, Trash2Icon, UploadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  deleteMedia,
  updateMediaAltText,
  getMedia,
  restoreMedia,
  permanentlyDeleteMedia,
} from "@/features/media/actions";

type Media = {
  id: string;
  url: string;
  secureUrl: string;
  altText: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  format: string | null;
  createdAt: string;
};

export function MediaLibrary({ media }: { media: Media[] }) {
  const [tab, setTab] = React.useState<"active" | "trash">("active");
  const [items, setItems] = React.useState(media);
  const [uploading, setUploading] = React.useState(false);
  const [selected, setSelected] = React.useState<Media | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = React.useRef<HTMLInputElement>(null);

  function loadTab(next: "active" | "trash") {
    setTab(next);
    startTransition(async () => {
      const result = await getMedia({ trashed: next === "trash" });
      setItems(JSON.parse(JSON.stringify(result)));
    });
  }

  async function handleUpload(files: FileList) {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "content-platform/media-library");
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setItems((prev) => [json.media, ...prev]);
      }
      toast.success("Upload complete");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function copyUrl(item: Media) {
    navigator.clipboard.writeText(item.secureUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  function handleTrash(id: string) {
    startTransition(async () => {
      const result = await deleteMedia(id);
      if (result.success) {
        setItems((prev) => prev.filter((m) => m.id !== id));
        toast.success("Moved to trash");
      } else toast.error(result.error);
    });
  }

  function handleRestore(id: string) {
    startTransition(async () => {
      const result = await restoreMedia(id);
      if (result.success) {
        setItems((prev) => prev.filter((m) => m.id !== id));
        toast.success("Restored");
      } else toast.error(result.error);
    });
  }

  function handlePermanentDelete(id: string) {
    if (!confirm("Permanently delete this asset from Cloudinary? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await permanentlyDeleteMedia(id);
      if (result.success) {
        setItems((prev) => prev.filter((m) => m.id !== id));
        toast.success("Deleted permanently");
      } else toast.error(result.error);
    });
  }

  function saveAlt(id: string, alt: string) {
    startTransition(async () => {
      const result = await updateMediaAltText(id, alt);
      if (result.success) {
        setItems((prev) => prev.map((m) => (m.id === id ? { ...m, altText: alt } : m)));
        toast.success("Alt text saved");
      } else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={tab} onValueChange={(v) => loadTab(v as "active" | "trash")}>
          <TabsList>
            <TabsTrigger value="active">Library</TabsTrigger>
            <TabsTrigger value="trash">Trash</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2Icon className="animate-spin" /> : <UploadIcon />}
          Upload
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelected(item)}
            className="group border-border relative aspect-square overflow-hidden rounded-lg border"
          >
            <Image src={item.secureUrl} alt={item.altText ?? ""} fill className="object-cover" unoptimized />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="truncate text-[10px] text-white">{item.format?.toUpperCase()}</span>
            </div>
          </button>
        ))}
        {items.length === 0 && (
          <p className="text-muted-foreground col-span-full py-16 text-center text-sm">
            {tab === "trash" ? "Trash is empty." : "No media uploaded yet."}
          </p>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Media details</DialogTitle>
              </DialogHeader>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                <Image src={selected.secureUrl} alt={selected.altText ?? ""} fill className="object-contain" unoptimized />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input readOnly value={selected.secureUrl} className="text-xs" />
                  <Button size="icon" variant="outline" onClick={() => copyUrl(selected)}>
                    {copiedId === selected.id ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                  </Button>
                </div>
                {tab === "active" && (
                  <Input
                    placeholder="Alt text (for accessibility & SEO)"
                    defaultValue={selected.altText ?? ""}
                    onBlur={(e) => saveAlt(selected.id, e.target.value)}
                  />
                )}
                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <span>
                    {selected.width}×{selected.height} · {selected.format?.toUpperCase()} ·{" "}
                    {selected.bytes ? `${Math.round(selected.bytes / 1024)}KB` : ""}
                  </span>
                  {tab === "active" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        handleTrash(selected.id);
                        setSelected(null);
                      }}
                    >
                      <Trash2Icon className="mr-1 size-3.5" /> Move to trash
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          handleRestore(selected.id);
                          setSelected(null);
                        }}
                      >
                        <RotateCcwIcon className="mr-1 size-3.5" /> Restore
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        disabled={pending}
                        onClick={() => {
                          handlePermanentDelete(selected.id);
                          setSelected(null);
                        }}
                      >
                        <Trash2Icon className="mr-1 size-3.5" /> Delete permanently
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
