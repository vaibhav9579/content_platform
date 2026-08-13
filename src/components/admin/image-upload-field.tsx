"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImageUpIcon, Loader2Icon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { compressImageIfNeeded } from "@/lib/image/compress-image";

export function ImageUploadField({
  value,
  onChange,
  folder = "content-platform/uploads",
  aspect = "aspect-video",
  label,
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  aspect?: string;
  label?: string;
}) {
  const [status, setStatus] = React.useState<"idle" | "compressing" | "uploading">("idle");
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setStatus("compressing");
    try {
      const { file: uploadFile, didCompress, originalBytes, finalBytes } = await compressImageIfNeeded(file);

      setStatus("uploading");
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      onChange(json.media.secureUrl);
      toast.success(
        didCompress
          ? `Image uploaded (${formatKb(originalBytes)} → ${formatKb(finalBytes)})`
          : "Image uploaded",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div
        className={cn(
          "bg-muted/40 border-border relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed",
          aspect,
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
      >
        {value ? (
          <>
            <Image src={value} alt="" fill className="object-cover" unoptimized />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute top-2 right-2 size-7"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
            >
              <XIcon className="size-3.5" />
            </Button>
          </>
        ) : status !== "idle" ? (
          <div className="text-muted-foreground flex flex-col items-center gap-1.5 text-xs">
            <Loader2Icon className="size-6 animate-spin" />
            {status === "compressing" ? "Optimizing…" : "Uploading…"}
          </div>
        ) : (
          <div className="text-muted-foreground flex flex-col items-center gap-1.5 text-xs">
            <ImageUpIcon className="size-6" />
            Click or drag image to upload
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}

function formatKb(bytes: number) {
  return `${Math.round(bytes / 1024)}KB`;
}
