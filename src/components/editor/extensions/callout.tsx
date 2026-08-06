import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { InfoIcon, LightbulbIcon, TriangleAlertIcon, OctagonAlertIcon, CheckCircle2Icon } from "lucide-react";

export type CalloutType = "note" | "tip" | "warning" | "danger" | "success";

const ICONS: Record<CalloutType, React.ComponentType<{ className?: string }>> = {
  note: InfoIcon,
  tip: LightbulbIcon,
  warning: TriangleAlertIcon,
  danger: OctagonAlertIcon,
  success: CheckCircle2Icon,
};

const STYLES: Record<CalloutType, string> = {
  note: "border-blue-500/30 bg-blue-500/8 text-blue-700 dark:text-blue-300",
  tip: "border-purple-500/30 bg-purple-500/8 text-purple-700 dark:text-purple-300",
  warning: "border-warning/40 bg-warning/8 text-warning",
  danger: "border-destructive/40 bg-destructive/8 text-destructive",
  success: "border-success/40 bg-success/8 text-success",
};

function CalloutView({ node }: NodeViewProps) {
  const type = (node.attrs.type ?? "note") as CalloutType;
  const Icon = ICONS[type] ?? InfoIcon;
  return (
    <NodeViewWrapper
      className={`callout not-prose my-4 flex gap-3 rounded-lg border px-4 py-3 ${STYLES[type]}`}
      data-type={type}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <NodeViewContent className="prose-article min-w-0 flex-1 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" />
    </NodeViewWrapper>
  );
}

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      type: {
        default: "note",
        parseHTML: (el) => el.getAttribute("data-type") ?? "note",
        renderHTML: (attrs) => ({ "data-type": attrs.type }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-node="callout"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-node": "callout", class: "callout" }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },
});

export default Callout;
