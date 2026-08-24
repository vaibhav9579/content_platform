import type { Editor, Range } from "@tiptap/core";
import { requestMediaPicker } from "@/lib/editor/media-picker-bridge";
import {
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  ListOrderedIcon,
  ListChecksIcon,
  QuoteIcon,
  CodeIcon,
  MinusIcon,
  TableIcon,
  ImageIcon,
  ClapperboardIcon,
  AtSignIcon,
  VideoIcon,
  FolderGit2Icon,
  InfoIcon,
  LightbulbIcon,
  TriangleAlertIcon,
  OctagonAlertIcon,
  CheckCircle2Icon,
  HelpCircleIcon,
  WorkflowIcon,
  SigmaIcon,
  PilcrowIcon,
  TableOfContentsIcon,
  ScaleIcon,
} from "lucide-react";

export type SlashCommandItem = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string[];
  command: (opts: { editor: Editor; range: Range }) => void;
};

const ALL_ITEMS: SlashCommandItem[] = [
  {
    title: "Text",
    description: "Plain paragraph text",
    icon: PilcrowIcon,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: Heading1Icon,
    keywords: ["h1", "title"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run(),
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: Heading2Icon,
    keywords: ["h2"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run(),
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: Heading3Icon,
    keywords: ["h3"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 4 }).run(),
  },
  {
    title: "Bullet List",
    description: "Unordered list of items",
    icon: ListIcon,
    keywords: ["ul", "bullet"],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: "Numbered List",
    description: "Ordered list of items",
    icon: ListOrderedIcon,
    keywords: ["ol", "numbered"],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: "Task List",
    description: "Checklist with checkboxes",
    icon: ListChecksIcon,
    keywords: ["todo", "checkbox"],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: "Quote",
    description: "Blockquote for citations",
    icon: QuoteIcon,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: "Code Block",
    description: "Syntax-highlighted code",
    icon: CodeIcon,
    keywords: ["codeblock"],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: "Divider",
    description: "Horizontal rule",
    icon: MinusIcon,
    keywords: ["hr", "separator"],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: "Table",
    description: "3×3 table with headers",
    icon: TableIcon,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    title: "Image",
    description: "Upload or choose an image",
    icon: ImageIcon,
    command: ({ editor, range }) => requestMediaPicker(editor, range),
  },
  {
    title: "YouTube",
    description: "Embed a YouTube video",
    icon: ClapperboardIcon,
    command: ({ editor, range }) => {
      const url = window.prompt("YouTube video URL");
      if (!url) return;
      editor.chain().focus().deleteRange(range).setYoutubeVideo({ src: url }).run();
    },
  },
  {
    title: "Tweet",
    description: "Embed a tweet / X post",
    icon: AtSignIcon,
    keywords: ["x", "twitter"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertContent({ type: "tweetEmbed" }).run(),
  },
  {
    title: "Video",
    description: "Embed an MP4/WebM video",
    icon: VideoIcon,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertContent({ type: "videoEmbed" }).run(),
  },
  {
    title: "GitHub Repo",
    description: "Link card for a GitHub repository",
    icon: FolderGit2Icon,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertContent({ type: "githubEmbed" }).run(),
  },
  {
    title: "Callout — Note",
    description: "Highlight important context",
    icon: InfoIcon,
    keywords: ["callout", "info"],
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({ type: "callout", attrs: { type: "note" }, content: [{ type: "paragraph" }] })
        .run(),
  },
  {
    title: "Callout — Tip",
    description: "Share a helpful tip",
    icon: LightbulbIcon,
    keywords: ["callout"],
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({ type: "callout", attrs: { type: "tip" }, content: [{ type: "paragraph" }] })
        .run(),
  },
  {
    title: "Callout — Warning",
    description: "Warn readers about a risk",
    icon: TriangleAlertIcon,
    keywords: ["callout", "alert"],
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({ type: "callout", attrs: { type: "warning" }, content: [{ type: "paragraph" }] })
        .run(),
  },
  {
    title: "Callout — Danger",
    description: "Flag a critical issue",
    icon: OctagonAlertIcon,
    keywords: ["callout", "alert", "error"],
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({ type: "callout", attrs: { type: "danger" }, content: [{ type: "paragraph" }] })
        .run(),
  },
  {
    title: "Callout — Success",
    description: "Confirm a positive outcome",
    icon: CheckCircle2Icon,
    keywords: ["callout", "alert"],
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({ type: "callout", attrs: { type: "success" }, content: [{ type: "paragraph" }] })
        .run(),
  },
  {
    title: "FAQ Section",
    description: "Structured question & answer block",
    icon: HelpCircleIcon,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertContent({ type: "faqBlock" }).run(),
  },
  {
    title: "Mermaid Diagram",
    description: "Flowcharts, sequence & more",
    icon: WorkflowIcon,
    keywords: ["diagram", "chart", "flowchart"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertContent({ type: "mermaidBlock" }).run(),
  },
  {
    title: "Math Formula",
    description: "LaTeX-rendered equation",
    icon: SigmaIcon,
    keywords: ["katex", "latex", "equation"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertContent({ type: "mathBlock" }).run(),
  },
  {
    title: "Pros & Cons",
    description: "Side-by-side comparison list",
    icon: ScaleIcon,
    keywords: ["comparison", "vs"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertContent({ type: "prosConsBlock" }).run(),
  },
  {
    title: "Table of Contents",
    description: "Auto-generated section index",
    icon: TableOfContentsIcon,
    keywords: ["toc"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertContent({ type: "tocBlock" }).run(),
  },
];

export function getSlashCommandItems(query: string): SlashCommandItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return ALL_ITEMS;
  return ALL_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.keywords?.some((k) => k.includes(q)),
  );
}
