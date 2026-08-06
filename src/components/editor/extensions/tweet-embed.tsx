import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Tweet } from "react-tweet";
import { AtSignIcon } from "lucide-react";

import { Input } from "@/components/ui/input";

function extractTweetId(input: string) {
  const match = input.match(/status\/(\d+)/);
  return match ? match[1] : input.trim();
}

function TweetEmbedView({ node, updateAttributes }: NodeViewProps) {
  const tweetId: string = node.attrs.tweetId;

  if (!tweetId) {
    return (
      <NodeViewWrapper className="not-prose my-4">
        <div className="border-border bg-muted/30 flex items-center gap-2 rounded-lg border border-dashed p-4">
          <AtSignIcon className="text-muted-foreground size-4 shrink-0" />
          <Input
            autoFocus
            placeholder="Paste a tweet URL and press Enter…"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const id = extractTweetId((e.target as HTMLInputElement).value);
                if (id) updateAttributes({ tweetId: id });
              }
            }}
          />
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="not-prose my-4 flex justify-center" data-type="tweet">
      <Tweet id={tweetId} />
    </NodeViewWrapper>
  );
}

export const TweetEmbed = Node.create({
  name: "tweetEmbed",
  group: "block",
  atom: true,

  addAttributes() {
    return { tweetId: { default: "" } };
  },

  parseHTML() {
    return [{ tag: 'div[data-node="tweet-embed"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-node": "tweet-embed" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TweetEmbedView);
  },
});

export default TweetEmbed;
