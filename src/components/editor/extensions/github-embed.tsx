import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { FolderGit2Icon, StarIcon } from "lucide-react";

import { Input } from "@/components/ui/input";

function parseRepo(url: string) {
  const match = url.match(/github\.com\/([^/]+)\/([^/?#]+)/);
  return match ? { owner: match[1], repo: match[2].replace(/\.git$/, "") } : null;
}

function GithubEmbedView({ node, updateAttributes }: NodeViewProps) {
  const url: string = node.attrs.url;
  const repo = url ? parseRepo(url) : null;

  if (!repo) {
    return (
      <NodeViewWrapper className="not-prose my-4">
        <div className="border-border bg-muted/30 flex items-center gap-2 rounded-lg border border-dashed p-4">
          <FolderGit2Icon className="text-muted-foreground size-4 shrink-0" />
          <Input
            autoFocus
            placeholder="Paste a GitHub repo URL and press Enter…"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                updateAttributes({ url: (e.target as HTMLInputElement).value.trim() });
              }
            }}
          />
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="not-prose my-4" data-type="github">
      <a
        href={`https://github.com/${repo.owner}/${repo.repo}`}
        target="_blank"
        rel="noopener noreferrer"
        className="border-border bg-card hover:border-foreground/20 flex items-center gap-3 rounded-xl border p-4 no-underline transition-colors"
      >
        <FolderGit2Icon className="size-8 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {repo.owner}/{repo.repo}
          </p>
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <StarIcon className="size-3" /> View on GitHub
          </p>
        </div>
      </a>
    </NodeViewWrapper>
  );
}

export const GithubEmbed = Node.create({
  name: "githubEmbed",
  group: "block",
  atom: true,

  addAttributes() {
    return { url: { default: "" } };
  },

  parseHTML() {
    return [{ tag: 'div[data-node="github-embed"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-node": "github-embed" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GithubEmbedView);
  },
});

export default GithubEmbed;
