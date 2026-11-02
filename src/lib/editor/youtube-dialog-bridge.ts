import type { Editor, Range } from "@tiptap/core";

type Handler = (editor: Editor, range?: Range) => void;

let handler: Handler | null = null;

export function registerYoutubeDialogHandler(fn: Handler | null) {
  handler = fn;
}

export function requestYoutubeDialog(editor: Editor, range?: Range) {
  handler?.(editor, range);
}
