"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface AvgDaysFailureChartProps {
  data: Array<{ variety: string; avgDays: number; count: number }>;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

export function AvgDaysFailureChart({ data }: AvgDaysFailureChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="variety" />
          <YAxis label={{ value: "Avg Days", angle: -90, position: "insideLeft" }} />
          <Tooltip formatter={(value: number) => [`${value} days`, "Avg Days to Failure"]} />
          <Bar dataKey="avgDays" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
