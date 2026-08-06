import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { VideoIcon } from "lucide-react";

import { Input } from "@/components/ui/input";

function VideoEmbedView({ node, updateAttributes }: NodeViewProps) {
  const src: string = node.attrs.src;

  if (!src) {
    return (
      <NodeViewWrapper className="not-prose my-4">
        <div className="border-border bg-muted/30 flex items-center gap-2 rounded-lg border border-dashed p-4">
          <VideoIcon className="text-muted-foreground size-4 shrink-0" />
          <Input
            autoFocus
            placeholder="Paste a video URL (.mp4, .webm) and press Enter…"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                updateAttributes({ src: (e.target as HTMLInputElement).value.trim() });
              }
            }}
          />
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="not-prose my-4" data-type="video">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video src={src} controls preload="metadata" className="w-full rounded-xl" />
    </NodeViewWrapper>
  );
}

export const VideoEmbed = Node.create({
  name: "videoEmbed",
  group: "block",
  atom: true,

  addAttributes() {
    return { src: { default: "" } };
  },

  parseHTML() {
    return [{ tag: 'div[data-node="video-embed"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-node": "video-embed" }),
      ["video", { src: node.attrs.src, controls: "true" }],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoEmbedView);
  },
});

export default VideoEmbed;
