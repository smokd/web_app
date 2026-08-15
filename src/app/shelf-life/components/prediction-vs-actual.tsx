"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Scatter,
  ScatterChart,
  ZAxis,
} from "recharts";

interface PredictionVsActualProps {
  sampleId: string;
}

interface ValidationResult {
  variety: string;
  pickTemp: number | null;
  brix: number | null;
  freightType: string | null;
  predictedShelfLife: number | null;
  actualShelfLife: number | null;
  error: number | null;
  limitingFactor: string;
}

export function PredictionVsActual({ sampleId }: PredictionVsActualProps) {
  const [data, setData] = useState<ValidationResult | null>(null);
  const [allValidations, setAllValidations] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Fetch this sample's validation
      const res = await fetch(`/api/shelf-life/reports/validation`);
      const report = await res.json();
      const sampleValidation = report.modelValidation?.samples?.find(
        (s: ValidationResult) => s.variety // we'd need to match by ID, but the API returns without ID
      );
      setAllValidations(report.modelValidation?.samples || []);
      setLoading(false);
    }
    fetchData();
  }, [sampleId]);

  if (loading) return <div className="text-sm text-gray-500">Loading validation...</div>;

  const chartData = allValidations
    .filter((v) => v.predictedShelfLife !== null && v.actualShelfLife !== null)
    .map((v) => ({
      name: v.variety,
      predicted: v.predictedShelfLife,
      actual: v.actualShelfLife,
      error: v.error,
    }));

  return (
    <div className="space-y-4">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              dataKey="actual"
              name="Actual"
              label={{ value: "Actual Shelf Life (days)", position: "insideBottom", offset: -5 }}
              domain={[0, "auto"]}
            />
            <YAxis
              type="number"
              dataKey="predicted"
              name="Predicted"
              label={{ value: "Predicted (days)", angle: -90, position: "insideLeft" }}
              domain={[0, "auto"]}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(value: number, name: string) => [`${value.toFixed(1)} days`, name]}
            />
            <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 40, y: 40 }]} stroke="#10b981" strokeDasharray="4 4" label="Perfect" />
            <Scatter data={chartData} fill="#3b82f6" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-500 text-center">
        Predicted vs Actual shelf life. Points on the green line = perfect prediction.
        Above the line = over-predicted (conservative). Below = under-predicted.
      </p>
    </div>
  );
}
