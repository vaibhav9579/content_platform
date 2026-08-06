"use client";

import * as React from "react";
import { useTheme } from "next-themes";

let idCounter = 0;

export function MermaidDiagram({ source }: { source: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [error, setError] = React.useState<string | null>(null);
  const [id] = React.useState(() => `mermaid-${++idCounter}`);

  React.useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: resolvedTheme === "dark" ? "dark" : "default",
          securityLevel: "strict",
          fontFamily: "var(--font-sans)",
        });
        const { svg } = await mermaid.render(id, source);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to render diagram");
      }
    }

    if (source?.trim()) render();
    return () => {
      cancelled = true;
    };
  }, [source, resolvedTheme, id]);

  if (error) {
    return (
      <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-3 text-xs">
        Diagram error: {error}
      </div>
    );
  }

  return <div ref={ref} className="flex justify-center overflow-x-auto" />;
}
