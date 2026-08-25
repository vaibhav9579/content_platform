"use client";

import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

type Slice = { label: string; value: number; color: string };

const FALLBACK_SLICE: Slice = { label: "Empty", value: 1, color: "var(--muted)" };

/**
 * SVG's `fill` attribute doesn't reliably parse every CSS color value the
 * same way regular CSS properties do (notably oklch(), which this theme
 * uses throughout) — recharts just forwards whatever string it's given
 * straight onto the `<path fill=...>`, so an unparsed value silently falls
 * back to SVG's default fill (black). Resolving each color through a
 * hidden probe element first hands recharts a browser-normalized rgb()
 * string instead, which `fill` always understands.
 *
 * The probe must be appended inside `containerRef` (not document.body) —
 * this card renders inside the admin panel's scoped `.admin-theme`
 * override, and a probe outside that subtree would read the public site's
 * default colors instead of the admin theme's.
 */
function useResolvedColors(containerRef: React.RefObject<HTMLElement | null>, colors: string[]) {
  const key = colors.join("|");
  const [resolved, setResolved] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const probe = document.createElement("span");
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.style.pointerEvents = "none";
    container.appendChild(probe);

    const next: Record<string, string> = {};
    for (const color of key.split("|")) {
      probe.style.color = color;
      next[color] = getComputedStyle(probe).color || color;
    }

    container.removeChild(probe);
    setResolved(next);
  }, [key, containerRef]);

  return resolved;
}

export function StatusDonut({ slices, total }: { slices: Slice[]; total: number }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const data = slices.filter((s) => s.value > 0);
  const items = data.length > 0 ? data : [FALLBACK_SLICE];
  const resolvedColors = useResolvedColors(containerRef, items.map((s) => s.color));

  return (
    <div ref={containerRef} className="relative mx-auto size-[168px]">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 168, height: 168 }}>
        <PieChart>
          <Pie
            data={items}
            dataKey="value"
            nameKey="label"
            innerRadius={58}
            outerRadius={80}
            paddingAngle={items.length > 1 ? 3 : 0}
            stroke="none"
          >
            {items.map((s) => (
              <Cell key={s.label} fill={resolvedColors[s.color] ?? "transparent"} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-muted-foreground text-xs">Total</p>
        <p className="text-2xl font-bold tabular-nums">{total}</p>
      </div>
    </div>
  );
}
