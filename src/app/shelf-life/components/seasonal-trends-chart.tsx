"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface SeasonalTrendsChartProps {
  data: Array<{
    week: number;
    avgShelfLife: number;
    sampleCount: number;
    failureRate: number;
  }>;
}

export function SeasonalTrendsChart({ data }: SeasonalTrendsChartProps) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="week" label={{ value: "Week", position: "insideBottom", offset: -5 }} />
          <YAxis yAxisId="left" label={{ value: "Avg Shelf Life (days)", angle: -90, position: "insideLeft" }} />
          <YAxis yAxisId="right" orientation="right" unit="%" label={{ value: "Failure Rate", angle: 90, position: "insideRight" }} />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="avgShelfLife" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Avg Shelf Life" />
          <Line yAxisId="right" type="monotone" dataKey="failureRate" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Failure Rate %" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
