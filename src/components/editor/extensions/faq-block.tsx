import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { PlusIcon, Trash2Icon, HelpCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FaqItem = { question: string; answer: string };

function FaqBlockView({ node, updateAttributes }: NodeViewProps) {
  const items: FaqItem[] = node.attrs.items ?? [];

  function update(index: number, patch: Partial<FaqItem>) {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    updateAttributes({ items: next });
  }

  function addItem() {
    updateAttributes({ items: [...items, { question: "", answer: "" }] });
  }

  function removeItem(index: number) {
    updateAttributes({ items: items.filter((_, i) => i !== index) });
  }

  return (
    <NodeViewWrapper className="not-prose bg-muted/30 my-6 space-y-3 rounded-xl border p-4" data-type="faq">
      <div className="text-muted-foreground flex items-center gap-2 text-sm font-semibold">
        <HelpCircleIcon className="size-4" /> FAQ Section
      </div>
      {items.map((item, i) => (
        <div key={i} className="bg-card space-y-2 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Question"
              value={item.question}
              onChange={(e) => update(i, { question: e.target.value })}
              className="font-medium"
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)}>
              <Trash2Icon className="size-4" />
            </Button>
          </div>
          <Textarea
            placeholder="Answer"
            rows={2}
            value={item.answer}
            onChange={(e) => update(i, { answer: e.target.value })}
          />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <PlusIcon /> Add question
      </Button>
    </NodeViewWrapper>
  );
}

export const FaqBlock = Node.create({
  name: "faqBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      items: {
        default: [{ question: "", answer: "" }] as FaqItem[],
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-node="faq-block"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const items = (node.attrs.items as FaqItem[]).filter((item) => item.question && item.answer);
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-node": "faq-block" }),
      ...items.map((item) => [
        "div",
        { class: "faq-item", "data-question": item.question },
        ["p", { class: "faq-question" }, item.question],
        ["p", { class: "faq-answer" }, item.answer],
      ]),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FaqBlockView);
  },
});

export default FaqBlock;
