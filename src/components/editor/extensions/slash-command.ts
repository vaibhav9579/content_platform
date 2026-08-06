import { Extension } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy, { type Instance as TippyInstance } from "tippy.js";

import { SlashCommandList, type SlashCommandItem } from "@/components/editor/menus/slash-command-list";
import { getSlashCommandItems } from "@/components/editor/menus/slash-command-items";

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        allowSpaces: false,
        startOfLine: false,
        command: ({ editor, range, props }: { editor: import("@tiptap/core").Editor; range: import("@tiptap/core").Range; props: SlashCommandItem }) => {
          props.command({ editor, range });
        },
      } satisfies Partial<SuggestionOptions>,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => getSlashCommandItems(query),
        render: () => {
          let component: ReactRenderer<{ onKeyDown: (props: { event: KeyboardEvent }) => boolean }>;
          let popup: TippyInstance[];

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashCommandList, {
                props,
                editor: props.editor,
              });
              if (!props.clientRect) return;

              popup = tippy("body", {
                getReferenceClientRect: () => props.clientRect!() as DOMRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
                animation: false,
              });
            },
            onUpdate(props) {
              component.updateProps(props);
              if (!props.clientRect) return;
              popup[0]?.setProps({ getReferenceClientRect: () => props.clientRect!() as DOMRect });
            },
            onKeyDown(props) {
              if (props.event.key === "Escape") {
                popup[0]?.hide();
                return true;
              }
              return component.ref?.onKeyDown(props) ?? false;
            },
            onExit() {
              popup[0]?.destroy();
              component.destroy();
            },
          };
        },
      }),
    ];
  },
});

export default SlashCommand;
