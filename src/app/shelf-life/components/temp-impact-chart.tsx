"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TempImpactChartProps {
  data: Array<{
    tempRange: string;
    avgShelfLife: number | null;
    failureRate: number | null;
  }>;
}

export function TempImpactChart({ data }: TempImpactChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="tempRange" />
          <YAxis yAxisId="left" label={{ value: "Avg Shelf Life (days)", angle: -90, position: "insideLeft" }} />
          <YAxis yAxisId="right" orientation="right" unit="%" label={{ value: "Failure Rate", angle: 90, position: "insideRight" }} />
          <Tooltip />
          <Bar yAxisId="left" dataKey="avgShelfLife" name="Avg Shelf Life" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="failureRate" name="Failure Rate" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
