"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface WeightLossChartProps {
  readings: Array<{
    day: number;
    weightGrams: number;
    weightLossPct: number | null;
    abnormal: boolean;
  }>;
  predictedCurve: Array<{
    day: number;
    predictedLossPct: number;
    upper95LossPct: number;
  }>;
}

export function WeightLossChart({ readings, predictedCurve }: WeightLossChartProps) {
  const maxDay = Math.max(
    ...readings.map((r) => r.day),
    ...predictedCurve.map((c) => c.day),
    14
  );

  const data = Array.from({ length: maxDay }, (_, i) => {
    const day = i + 1;
    const actual = readings.find((r) => r.day === day);
    const predicted = predictedCurve.find((c) => c.day === day);
    return {
      day,
      actual: actual?.weightLossPct ?? null,
      predicted: predicted?.predictedLossPct ?? null,
      upper95: predicted?.upper95LossPct ?? null,
    };
  });

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="day" label={{ value: "Day", position: "insideBottom", offset: -5 }} />
          <YAxis label={{ value: "Loss %", angle: -90, position: "insideLeft" }} domain={[0, "auto"]} />
          <Tooltip formatter={(value: number, name: string) => [value !== null ? `${value.toFixed(2)}%` : "—", name]} />
          <Legend />
          <ReferenceLine y={10} stroke="#ef4444" strokeDasharray="4 4" label="10% Fail" />
          <Line type="monotone" dataKey="predicted" stroke="#94a3b8" strokeDasharray="4 4" dot={false} name="Predicted" />
          <Line type="monotone" dataKey="upper95" stroke="#cbd5e1" strokeDasharray="2 2" dot={false} name="Upper 95%" />
          <Line type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={2} dot={{ r: 4, fill: "#2563eb" }} activeDot={{ r: 6 }} name="Actual" connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
