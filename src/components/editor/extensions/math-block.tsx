import * as React from "react";
import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { SigmaIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { KatexRenderer } from "@/components/shared/katex-renderer";

function MathBlockView({ node, updateAttributes }: NodeViewProps) {
  const formula: string = node.attrs.formula;

  return (
    <NodeViewWrapper className="not-prose my-4" data-type="math">
      <div className="border-border bg-card rounded-xl border p-4">
        <div className="mb-2 flex items-center gap-2">
          <SigmaIcon className="text-muted-foreground size-4 shrink-0" />
          <Input
            value={formula}
            placeholder="E = mc^2"
            className="font-mono text-sm"
            onChange={(e) => updateAttributes({ formula: e.target.value })}
          />
        </div>
        {formula && (
          <div className="overflow-x-auto py-1">
            <KatexRenderer formula={formula} block />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const MathBlock = Node.create({
  name: "mathBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return { formula: { default: "" } };
  },

  parseHTML() {
    return [{ tag: 'div[data-node="math-block"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-node": "math-block" }), node.attrs.formula];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathBlockView);
  },
});

export default MathBlock;
