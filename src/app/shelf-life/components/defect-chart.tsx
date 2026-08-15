"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DefectChartProps {
  observations: Array<{
    day: number;
    shrivelCount: number;
    softCount: number;
    collapsedCount: number;
  }>;
}

export function DefectChart({ observations }: DefectChartProps) {
  const data = observations.map((o) => ({
    day: `D${o.day}`,
    Shrivel: o.shrivelCount,
    Soft: o.softCount,
    Collapsed: o.collapsedCount,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="day" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Shrivel" stackId="a" fill="#f59e0b" />
          <Bar dataKey="Soft" stackId="a" fill="#ef4444" />
          <Bar dataKey="Collapsed" stackId="a" fill="#7c3aed" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
