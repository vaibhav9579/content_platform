"use client";

import * as React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

export function KatexRenderer({ formula, block = false }: { formula: string; block?: boolean }) {
  const html = React.useMemo(() => {
    try {
      return katex.renderToString(formula, { throwOnError: false, displayMode: block });
    } catch {
      return formula;
    }
  }, [formula, block]);

  // eslint-disable-next-line react/no-danger
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
