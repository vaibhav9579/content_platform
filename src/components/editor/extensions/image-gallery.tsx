import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import NextImage from "next/image";
import { PlusIcon, Trash2Icon, ImagesIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaPickerDialog, type PickedMedia } from "@/components/admin/media-picker-dialog";

type GalleryImage = { url: string; alt: string; caption: string; link: string };

function ImageGalleryView({ node, updateAttributes }: NodeViewProps) {
  const images: GalleryImage[] = node.attrs.images ?? [];
  const [pickerOpen, setPickerOpen] = React.useState(false);

  function addImage(media: PickedMedia) {
    updateAttributes({
      images: [...images, { url: media.url, alt: media.altText ?? "", caption: media.altText ?? "", link: "" }],
    });
  }

  function updateImage(index: number, patch: Partial<GalleryImage>) {
    updateAttributes({ images: images.map((img, i) => (i === index ? { ...img, ...patch } : img)) });
  }

  function removeImage(index: number) {
    updateAttributes({ images: images.filter((_, i) => i !== index) });
  }

  return (
    <NodeViewWrapper className="not-prose my-4" data-type="image-gallery">
      <div className="bg-muted/20 space-y-3 rounded-xl border p-4">
        <div className="text-muted-foreground flex items-center gap-2 text-sm font-semibold">
          <ImagesIcon className="size-4" /> Image Row
        </div>

        {images.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img, i) => (
              <div key={i} className="bg-card space-y-2 rounded-lg border p-2">
                <div className="bg-muted relative aspect-video overflow-hidden rounded-md">
                  <NextImage src={img.url} alt="" fill sizes="200px" className="object-cover" unoptimized />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute top-1.5 right-1.5 size-6"
                    onClick={() => removeImage(i)}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
                <Input
                  placeholder="Caption (optional)"
                  value={img.caption}
                  onChange={(e) => updateImage(i, { caption: e.target.value })}
                />
                <Input
                  placeholder="Link URL (optional, e.g. a product page)"
                  value={img.link ?? ""}
                  onChange={(e) => updateImage(i, { link: e.target.value })}
                />
              </div>
            ))}
          </div>
        )}

        <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
          <PlusIcon /> Add image
        </Button>
      </div>

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={addImage}
        folder="content-platform/posts"
      />
    </NodeViewWrapper>
  );
}

export const ImageGallery = Node.create({
  name: "imageGallery",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      images: { default: [] as GalleryImage[] },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-node="image-gallery"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const images = (node.attrs.images as GalleryImage[]).filter((img) => img.url);
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-node": "image-gallery",
        style: "display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin:1.5em 0;",
      }),
      ...images.map((img) => {
        const figureChildren = [
          [
            "img",
            {
              src: img.url,
              alt: img.alt || img.caption || "",
              style: "width:100%;height:auto;border-radius:12px;display:block;",
            },
          ],
          ...(img.caption
            ? [
                [
                  "figcaption",
                  {
                    style:
                      "margin-top:0.5em;text-align:center;font-size:0.875rem;color:var(--muted-foreground);border:1px solid var(--border);border-radius:6px;padding:0.375em 0.5em;",
                  },
                  img.caption,
                ],
              ]
            : []),
        ];
        return [
          "figure",
          { style: "margin:0;" },
          ...(img.link
            ? [
                [
                  "a",
                  {
                    href: img.link,
                    target: "_blank",
                    rel: "noopener",
                    style: "display:block;text-decoration:none;color:inherit;",
                  },
                  ...figureChildren,
                ],
              ]
            : figureChildren),
        ];
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageGalleryView);
  },
});

export default ImageGallery;
