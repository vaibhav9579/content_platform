"use client";

import * as React from "react";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import TextAlign from "@tiptap/extension-text-align";
import CharacterCount from "@tiptap/extension-character-count";
import Youtube from "@tiptap/extension-youtube";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";

import { BubbleToolbar } from "@/components/editor/menus/bubble-toolbar";
import { SlashCommand } from "@/components/editor/extensions/slash-command";
import { CodeBlockWithCopy } from "@/components/editor/extensions/code-block-with-copy";
import { Callout } from "@/components/editor/extensions/callout";
import { FaqBlock } from "@/components/editor/extensions/faq-block";
import { TweetEmbed } from "@/components/editor/extensions/tweet-embed";
import { VideoEmbed } from "@/components/editor/extensions/video-embed";
import { GithubEmbed } from "@/components/editor/extensions/github-embed";
import { MermaidBlock } from "@/components/editor/extensions/mermaid-block";
import { MathBlock } from "@/components/editor/extensions/math-block";
import { TocBlock } from "@/components/editor/extensions/toc-block";
import { ProsConsBlock } from "@/components/editor/extensions/pros-cons-block";

export type TiptapEditorHandle = {
  getHTML: () => string;
  getJSON: () => JSONContent;
  getText: () => string;
  focus: () => void;
  setContent: (content: string | JSONContent) => void;
};

async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", "content-platform/posts");
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) return null;
  const json = await res.json();
  return json.media.secureUrl as string;
}

export const TiptapEditor = React.forwardRef<
  TiptapEditorHandle,
  {
    initialContent?: JSONContent | null;
    editable?: boolean;
    onUpdate?: (payload: { json: JSONContent; html: string; text: string; words: number }) => void;
  }
>(function TiptapEditor({ initialContent, editable = true, onUpdate }, ref) {
  const editor = useEditor({
    immediatelyRender: false,
    editable,
    content: initialContent ?? "",
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer nofollow" },
        },
      }),
      CodeBlockWithCopy,
      Image.configure({ HTMLAttributes: { class: "rounded-xl" }, allowBase64: false }),
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === "heading" ? "Heading…" : "Write something, or press '/' for commands…",
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      CharacterCount,
      Youtube.configure({
        width: 728,
        height: 410,
        HTMLAttributes: { class: "rounded-xl w-full aspect-video" },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Color,
      TextStyle,
      Highlight.configure({ multicolor: false }),
      Typography,
      Callout,
      FaqBlock,
      TweetEmbed,
      VideoEmbed,
      GithubEmbed,
      MermaidBlock,
      MathBlock,
      TocBlock,
      ProsConsBlock,
      SlashCommand,
    ],
    editorProps: {
      attributes: {
        class: "prose-article focus:outline-none min-h-[60vh]",
      },
      handleDrop: (view, event) => {
        const file = event.dataTransfer?.files?.[0];
        if (!file || !file.type.startsWith("image/")) return false;
        event.preventDefault();
        uploadFile(file).then((url) => {
          if (!url) return;
          const { schema } = view.state;
          const node = schema.nodes.image.create({ src: url });
          const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
          const tr = view.state.tr.insert(coords?.pos ?? view.state.selection.from, node);
          view.dispatch(tr);
        });
        return true;
      },
      handlePaste: (view, event) => {
        const file = Array.from(event.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
        if (!file) return false;
        event.preventDefault();
        uploadFile(file).then((url) => {
          if (!url) return;
          const { schema } = view.state;
          const node = schema.nodes.image.create({ src: url });
          const tr = view.state.tr.replaceSelectionWith(node);
          view.dispatch(tr);
        });
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate?.({
        json: editor.getJSON(),
        html: editor.getHTML(),
        text: editor.getText(),
        words: editor.storage.characterCount?.words() ?? 0,
      });
    },
  });

  React.useImperativeHandle(ref, () => ({
    getHTML: () => editor?.getHTML() ?? "",
    getJSON: () => editor?.getJSON() ?? {},
    getText: () => editor?.getText() ?? "",
    focus: () => editor?.commands.focus(),
    setContent: (content) => editor?.commands.setContent(content),
  }));

  if (!editor) return null;

  return (
    <div className="w-full">
      <BubbleToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
});
