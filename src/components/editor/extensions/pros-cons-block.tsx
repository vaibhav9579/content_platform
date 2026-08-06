import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { PlusIcon, Trash2Icon, ThumbsUpIcon, ThumbsDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ProsConsAttrs = { pros: string[]; cons: string[] };

function Column({
  title,
  icon: Icon,
  items,
  onChange,
  tone,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: string[];
  onChange: (items: string[]) => void;
  tone: "success" | "destructive";
}) {
  return (
    <div className={`rounded-lg border p-3 ${tone === "success" ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}>
      <p className={`mb-2 flex items-center gap-1.5 text-sm font-semibold ${tone === "success" ? "text-success" : "text-destructive"}`}>
        <Icon className="size-4" /> {title}
      </p>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex gap-1.5">
            <Input
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
            <Button variant="ghost" size="icon" onClick={() => onChange(items.filter((_, idx) => idx !== i))}>
              <Trash2Icon className="size-3.5" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => onChange([...items, ""])}>
          <PlusIcon className="size-3.5" /> Add
        </Button>
      </div>
    </div>
  );
}

function ProsConsView({ node, updateAttributes }: NodeViewProps) {
  const attrs = node.attrs as ProsConsAttrs;

  return (
    <NodeViewWrapper className="not-prose my-4" data-type="pros-cons">
      <div className="grid gap-3 sm:grid-cols-2">
        <Column
          title="Pros"
          icon={ThumbsUpIcon}
          items={attrs.pros}
          onChange={(pros) => updateAttributes({ pros })}
          tone="success"
        />
        <Column
          title="Cons"
          icon={ThumbsDownIcon}
          items={attrs.cons}
          onChange={(cons) => updateAttributes({ cons })}
          tone="destructive"
        />
      </div>
    </NodeViewWrapper>
  );
}

export const ProsConsBlock = Node.create({
  name: "prosConsBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      pros: { default: ["", ""] },
      cons: { default: ["", ""] },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-node="pros-cons-block"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const attrs = node.attrs as ProsConsAttrs;
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-node": "pros-cons-block" }),
      [
        "table",
        {},
        [
          "tr",
          {},
          ["th", {}, "Pros"],
          ["th", {}, "Cons"],
        ],
        [
          "tr",
          {},
          ["td", {}, attrs.pros.filter(Boolean).join(" · ")],
          ["td", {}, attrs.cons.filter(Boolean).join(" · ")],
        ],
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ProsConsView);
  },
});

export default ProsConsBlock;
