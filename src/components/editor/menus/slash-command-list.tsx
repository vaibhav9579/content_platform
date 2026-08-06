import * as React from "react";
import type { Editor, Range } from "@tiptap/core";

import { cn } from "@/lib/utils";
import type { SlashCommandItem } from "@/components/editor/menus/slash-command-items";

export type { SlashCommandItem };

type Props = {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
  editor: Editor;
  range: Range;
};

export const SlashCommandList = React.forwardRef<{ onKeyDown: (props: { event: KeyboardEvent }) => boolean }, Props>(
  function SlashCommandList(props, ref) {
    const [selected, setSelected] = React.useState(0);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => setSelected(0), [props.items]);

    const select = React.useCallback(
      (index: number) => {
        const item = props.items[index];
        if (item) props.command(item);
      },
      [props],
    );

    React.useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowDown") {
          setSelected((prev) => (prev + 1) % props.items.length);
          return true;
        }
        if (event.key === "ArrowUp") {
          setSelected((prev) => (prev - 1 + props.items.length) % props.items.length);
          return true;
        }
        if (event.key === "Enter") {
          select(selected);
          return true;
        }
        return false;
      },
    }));

    React.useEffect(() => {
      const el = containerRef.current?.children[selected] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest" });
    }, [selected]);

    if (props.items.length === 0) {
      return (
        <div className="bg-popover text-muted-foreground w-72 rounded-xl border p-3 text-sm shadow-lg">
          No matching blocks
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className="bg-popover max-h-80 w-72 overflow-y-auto rounded-xl border p-1.5 shadow-lg"
      >
        {props.items.map((item, index) => (
          <button
            key={item.title}
            type="button"
            onClick={() => select(index)}
            onMouseEnter={() => setSelected(index)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
              index === selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
            )}
          >
            <span className="bg-background flex size-8 shrink-0 items-center justify-center rounded-md border">
              <item.icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium">{item.title}</span>
              <span className="text-muted-foreground block truncate text-xs">{item.description}</span>
            </span>
          </button>
        ))}
      </div>
    );
  },
);
