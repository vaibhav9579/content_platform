import * as React from "react";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { CheckIcon, CopyIcon } from "lucide-react";

import { lowlight } from "@/lib/content/lowlight";

function CodeBlockView({ node }: NodeViewProps) {
  const [copied, setCopied] = React.useState(false);
  const language = node.attrs.language || "plaintext";

  function copy(el: HTMLElement | null) {
    const text = el?.querySelector("code")?.textContent ?? "";
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <NodeViewWrapper className="group relative my-4" data-type="code-block">
      <div className="border-border bg-card flex items-center justify-between rounded-t-xl border border-b-0 px-3 py-1.5">
        <span className="text-muted-foreground font-mono text-[11px] uppercase tracking-wide">{language}</span>
        <button
          type="button"
          contentEditable={false}
          onClick={(e) => copy(e.currentTarget.closest("[data-type='code-block']"))}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[11px] transition-colors"
        >
          {copied ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="!mt-0 !rounded-t-none">
        <NodeViewContent<"code"> as="code" />
      </pre>
    </NodeViewWrapper>
  );
}

export const CodeBlockWithCopy = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
}).configure({ lowlight });

export default CodeBlockWithCopy;
