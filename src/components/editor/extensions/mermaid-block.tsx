import * as React from "react";
import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { WorkflowIcon, PencilIcon } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MermaidDiagram } from "@/components/shared/mermaid-diagram";

const DEFAULT_SOURCE = "graph TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[Result 1]\n  B -->|No| D[Result 2]";

function MermaidBlockView({ node, updateAttributes }: NodeViewProps) {
  const source: string = node.attrs.source || DEFAULT_SOURCE;
  const [editing, setEditing] = React.useState(!node.attrs.source);

  return (
    <NodeViewWrapper className="not-prose my-4" data-type="mermaid">
      <div className="border-border bg-card overflow-hidden rounded-xl border">
        <div className="border-border bg-muted/40 flex items-center justify-between border-b px-3 py-1.5">
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
            <WorkflowIcon className="size-3.5" /> Mermaid diagram
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing((v) => !v)}>
            <PencilIcon className="size-3.5" /> {editing ? "Preview" : "Edit"}
          </Button>
        </div>
        {editing ? (
          <Textarea
            value={source}
            onChange={(e) => updateAttributes({ source: e.target.value })}
            rows={6}
            className="rounded-none border-0 font-mono text-xs focus-visible:ring-0"
          />
        ) : (
          <div className="p-4">
            <MermaidDiagram source={source} />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const MermaidBlock = Node.create({
  name: "mermaidBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return { source: { default: "" } };
  },

  parseHTML() {
    return [{ tag: 'div[data-node="mermaid-block"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return ["pre", mergeAttributes(HTMLAttributes, { "data-node": "mermaid-block" }), node.attrs.source];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidBlockView);
  },
});

export default MermaidBlock;
