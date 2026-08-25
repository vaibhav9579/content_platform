"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

type TrafficPoint = { date: string; pageViews: number; uniqueVisitors: number };

export function TrafficChart({ data }: { data: TrafficPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220} initialDimension={{ width: 700, height: 220 }}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="pageViewsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => v.slice(5)}
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          interval={4}
        />
        <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value) => (value === "pageViews" ? "Page views" : "Unique visitors")}
        />
        <Area
          type="monotone"
          dataKey="pageViews"
          stroke="var(--color-chart-2)"
          strokeWidth={2}
          fill="url(#pageViewsGradient)"
        />
        <Area
          type="monotone"
          dataKey="uniqueVisitors"
          stroke="var(--color-chart-1)"
          strokeWidth={2}
          fill="url(#visitorsGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
