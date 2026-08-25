"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

type Slice = { label: string; value: number; color: string };

export function StatusDonut({ slices, total }: { slices: Slice[]; total: number }) {
  const data = slices.filter((s) => s.value > 0);

  return (
    <div className="relative mx-auto size-[168px]">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 168, height: 168 }}>
        <PieChart>
          <Pie
            data={data.length > 0 ? data : [{ label: "Empty", value: 1, color: "var(--color-muted)" }]}
            dataKey="value"
            nameKey="label"
            innerRadius={58}
            outerRadius={80}
            paddingAngle={data.length > 1 ? 3 : 0}
            stroke="none"
          >
            {(data.length > 0 ? data : [{ label: "Empty", value: 1, color: "var(--color-muted)" }]).map((s) => (
              <Cell key={s.label} fill={s.color} />
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
