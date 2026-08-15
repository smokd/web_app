"use client";

import { StatusBadge } from "./status-badge";
import { Clock, TrendingDown, Thermometer, Droplets } from "lucide-react";

interface SampleStatusHeaderProps {
  sample: {
    sampleId: string;
    variety: string;
    sampleType: string;
    freightType: string | null;
    status: string;
    totalDays: number | null;
    pickTemp: number | null;
    brix: number | null;
    packWeight: number | null;
  };
  prediction?: {
    predictedShelfLife: number | null;
    recommendedShelfLife: number | null;
    riskLevel: string;
    remainingDays: number | null;
  } | null;
  currentDay: number;
}

export function SampleStatusHeader({ sample, prediction, currentDay }: SampleStatusHeaderProps) {
  const remaining = prediction?.remainingDays ?? null;
  const predicted = prediction?.predictedShelfLife ?? null;

  const progressPercent = predicted && predicted > 0
    ? Math.min(100, (currentDay / predicted) * 100)
    : 0;

  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold">{sample.sampleId}</h1>
            <StatusBadge status={sample.status} />
          </div>
          <p className="text-sm text-gray-500">
            {sample.variety} • {sample.sampleType.replace("_", " ")}
            {sample.freightType && ` • ${sample.freightType}`}
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          {sample.pickTemp !== null && (
            <div className="flex items-center gap-1 text-gray-600">
              <Thermometer className="h-4 w-4" />
              {sample.pickTemp}°C
            </div>
          )}
          {sample.brix !== null && (
            <div className="flex items-center gap-1 text-gray-600">
              <Droplets className="h-4 w-4" />
              {sample.brix}°Brix
            </div>
          )}
          {sample.packWeight !== null && (
            <div className="flex items-center gap-1 text-gray-600">
              {sample.packWeight}g pack
            </div>
          )}
        </div>
      </div>

      {predicted !== null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>Day {currentDay} / predicted {predicted.toFixed(1)} days</span>
            </div>
            {remaining !== null && (
              <span className={`font-medium ${
                remaining <= 2 ? "text-red-600" :
                remaining <= 5 ? "text-amber-600" : "text-emerald-600"
              }`}>
                {remaining > 0 ? `${remaining.toFixed(1)} days remaining` : "Beyond predicted limit"}
              </span>
            )}
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                progressPercent > 90 ? "bg-red-500" :
                progressPercent > 70 ? "bg-amber-500" : "bg-blue-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Day 0</span>
            <span>Predicted: {predicted.toFixed(1)} days</span>
          </div>
        </div>
      )}

      {prediction && (
        <div className="flex flex-wrap gap-2">
          <div className="bg-slate-50 border rounded-lg px-3 py-1.5 text-xs">
            <span className="text-gray-500">Recommended:</span>{" "}
            <span className="font-medium">{prediction.recommendedShelfLife?.toFixed(1) ?? "—"} days</span>
          </div>
          <div className="bg-slate-50 border rounded-lg px-3 py-1.5 text-xs">
            <span className="text-gray-500">Risk:</span>{" "}
            <StatusBadge status={prediction.riskLevel} className="text-[10px]" />
          </div>
        </div>
      )}
    </div>
  );
}
