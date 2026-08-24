import type { Editor, Range } from "@tiptap/core";

/**
 * The slash-command menu runs outside React (it manipulates the editor via
 * imperative Tiptap commands, not JSX), but inserting an image should open a
 * real React dialog (MediaPickerDialog). This tiny singleton bridges the
 * two: TiptapEditor registers a handler on mount that opens its dialog, and
 * the "Image" slash-command item just calls `requestMediaPicker`.
 */
type Handler = (editor: Editor, range: Range) => void;

let handler: Handler | null = null;

export function registerMediaPickerHandler(fn: Handler | null) {
  handler = fn;
}

export function requestMediaPicker(editor: Editor, range: Range) {
  handler?.(editor, range);
}
