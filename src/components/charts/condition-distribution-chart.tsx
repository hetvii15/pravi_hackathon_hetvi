"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

// Condition bands are ordered good -> bad; map each to the theme's
// severity-ordered chart colors (chart-2 green ... chart-5 red).
const BAND_COLORS: Record<string, string> = {
  Excellent: "var(--chart-2)",
  Good: "var(--chart-2)",
  Fair: "var(--chart-3)",
  Poor: "var(--chart-4)",
  Critical: "var(--chart-5)",
};

export function ConditionDistributionChart({
  data,
}: {
  data: { band: string; count: number }[];
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="band"
            innerRadius={48}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell key={entry.band} fill={BAND_COLORS[entry.band] ?? "var(--chart-1)"} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
