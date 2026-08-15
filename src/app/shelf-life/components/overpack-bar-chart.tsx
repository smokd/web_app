"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface OverpackBarChartProps {
  data: Array<{ variety: string; air: number | null; sea: number | null }>;
}

export function OverpackBarChart({ data }: OverpackBarChartProps) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" domain={[0, 20]} unit="%" />
          <YAxis type="category" dataKey="variety" width={80} />
          <Tooltip formatter={(value: number) => [`${value}%`, ""]} />
          <Legend />
          <Bar dataKey="air" name="AIR" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          <Bar dataKey="sea" name="SEA" fill="#10b981" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
