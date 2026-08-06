import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { ListIcon } from "lucide-react";

function TocBlockView() {
  return (
    <NodeViewWrapper className="not-prose my-4" data-type="toc" contentEditable={false}>
      <div className="border-border bg-muted/30 rounded-xl border p-4">
        <p className="text-muted-foreground flex items-center gap-2 text-sm font-semibold">
          <ListIcon className="size-4" /> Table of Contents
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Auto-generated from this article&apos;s headings when published.
        </p>
      </div>
    </NodeViewWrapper>
  );
}

export const TocBlock = Node.create({
  name: "tocBlock",
  group: "block",
  atom: true,

  parseHTML() {
    return [{ tag: 'div[data-node="toc-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-node": "toc-block" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TocBlockView);
  },
});

export default TocBlock;
