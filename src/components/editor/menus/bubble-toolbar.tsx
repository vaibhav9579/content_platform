"use client";

import * as React from "react";
import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { EditorState } from "@tiptap/pm/state";
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  CodeIcon,
  LinkIcon,
  HighlighterIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

function Btn({
  active,
  onClick,
  children,
  label,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "hover:bg-accent flex size-7 items-center justify-center rounded-md transition-colors",
        active && "bg-accent text-accent-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function BubbleToolbar({ editor }: { editor: Editor }) {
  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ state }: { state: EditorState }) => !state.selection.empty}
      className="bg-popover flex items-center gap-0.5 rounded-lg border p-1 shadow-lg"
    >
      <Btn label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <BoldIcon className="size-3.5" />
      </Btn>
      <Btn
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <ItalicIcon className="size-3.5" />
      </Btn>
      <Btn
        label="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-3.5" />
      </Btn>
      <Btn
        label="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <StrikethroughIcon className="size-3.5" />
      </Btn>
      <Btn label="Code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
        <CodeIcon className="size-3.5" />
      </Btn>
      <Btn
        label="Highlight"
        active={editor.isActive("highlight")}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        <HighlighterIcon className="size-3.5" />
      </Btn>
      <Btn
        label="Link"
        active={editor.isActive("link")}
        onClick={() => {
          const previous = editor.getAttributes("link").href as string | undefined;
          const url = window.prompt("URL", previous ?? "https://");
          if (url === null) return;
          if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
          }
          editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }}
      >
        <LinkIcon className="size-3.5" />
      </Btn>
    </BubbleMenu>
  );
}
