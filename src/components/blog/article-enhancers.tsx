"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import type { TocItem } from "@/lib/content/toc";

/**
 * The server renders article HTML as a static string (fast, SEO-friendly).
 * A few block types need client-side JS to become visual (Mermaid diagrams,
 * KaTeX formulas, the inline TOC placeholder) — this component progressively
 * enhances those specific nodes in place after hydration, without turning
 * the whole article into client-rendered React.
 */
export function ArticleEnhancers({ containerId, toc }: { containerId: string; toc: TocItem[] }) {
  const { resolvedTheme } = useTheme();

  React.useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    let cancelled = false;

    async function enhanceMermaid() {
      const nodes = container!.querySelectorAll('[data-node="mermaid-block"]');
      if (nodes.length === 0) return;
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: resolvedTheme === "dark" ? "dark" : "default",
        securityLevel: "strict",
      });
      for (const [i, node] of Array.from(nodes).entries()) {
        const source = node.textContent ?? "";
        if (!source.trim()) continue;
        try {
          const { svg } = await mermaid.render(`mermaid-article-${i}`, source);
          if (!cancelled) node.innerHTML = svg;
        } catch {
          // leave the raw source visible on render failure
        }
      }
    }

    async function enhanceMath() {
      const nodes = container!.querySelectorAll('[data-node="math-block"]');
      if (nodes.length === 0) return;
      const katex = (await import("katex")).default;
      nodes.forEach((node) => {
        const formula = node.textContent ?? "";
        try {
          node.innerHTML = katex.renderToString(formula, { throwOnError: false, displayMode: true });
        } catch {
          // leave raw formula text on failure
        }
      });
    }

    function enhanceToc() {
      const nodes = container!.querySelectorAll('[data-node="toc-block"]');
      if (nodes.length === 0 || toc.length < 2) return;
      nodes.forEach((node) => {
        const list = toc
          .map((item) => `<li style="padding-left:${item.level === 3 ? "1rem" : "0"}"><a href="#${item.id}">${item.text}</a></li>`)
          .join("");
        node.innerHTML = `<p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Contents</p><ul class="space-y-1.5 text-sm list-none">${list}</ul>`;
      });
    }

    enhanceMermaid();
    enhanceMath();
    enhanceToc();

    return () => {
      cancelled = true;
    };
  }, [containerId, toc, resolvedTheme]);

  return null;
}
