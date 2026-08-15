"use client";

import { StatusBadge } from "./status-badge";
import { AlertTriangle, Info, TrendingDown, Scale, Thermometer, Droplets } from "lucide-react";

interface ShelfLifePredictionCardProps {
  prediction: {
    predictedShelfLife: number | null;
    recommendedShelfLife: number | null;
    qualityShelfLife: number | null;
    weightShelfLife: number | null;
    limitingFactor: "QUALITY" | "WEIGHT_LOSS" | "INSUFFICIENT_DATA";
    confidence: "HIGH" | "MODERATE" | "LOW";
    sampleCount: number;
    riskAt14Days: number | null;
    riskAt30Days: number | null;
    warnings: string[];
    explanation: string[];
    input?: {
      variety: string;
      pickTemp: number;
      brix: number;
      freightType: string;
    };
  } | null;
  loading?: boolean;
}

export function ShelfLifePredictionCard({ prediction, loading }: ShelfLifePredictionCardProps) {
  if (loading) {
    return (
      <div className="bg-white border rounded-xl p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-gray-100 rounded-lg" />
          <div className="h-24 bg-gray-100 rounded-lg" />
          <div className="h-24 bg-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!prediction) return null;

  const {
    predictedShelfLife,
    recommendedShelfLife,
    qualityShelfLife,
    weightShelfLife,
    limitingFactor,
    confidence,
    sampleCount,
    riskAt14Days,
    riskAt30Days,
    warnings,
    explanation,
    input,
  } = prediction;

  const hasData = predictedShelfLife !== null;

  return (
    <div className="space-y-4">
      {/* Main prediction cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-sm text-blue-600 font-medium mb-1">Predicted Shelf Life</p>
          <p className="text-4xl font-bold text-blue-800">
            {hasData ? `${predictedShelfLife!.toFixed(1)}` : "—"}
            <span className="text-lg font-normal text-blue-600 ml-1">days</span>
          </p>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={confidence} />
            <span className="text-xs text-blue-500">{sampleCount} samples</span>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <p className="text-sm text-emerald-600 font-medium mb-1">Recommended Operational</p>
          <p className="text-4xl font-bold text-emerald-800">
            {recommendedShelfLife !== null ? `${recommendedShelfLife.toFixed(1)}` : "—"}
            <span className="text-lg font-normal text-emerald-600 ml-1">days</span>
          </p>
          <p className="text-xs text-emerald-500 mt-2">
            Conservative estimate with safety margin
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-sm text-amber-600 font-medium mb-1">Limiting Factor</p>
          <p className="text-2xl font-bold text-amber-800">
            {limitingFactor === "INSUFFICIENT_DATA" ? "Insufficient Data" :
             limitingFactor === "QUALITY" ? "Quality Degradation" :
             "Weight Loss"}
          </p>
          <div className="mt-2 space-y-1 text-xs text-amber-700">
            {qualityShelfLife !== null && (
              <p>Quality limit: {qualityShelfLife.toFixed(1)} days</p>
            )}
            {weightShelfLife !== null && (
              <p>Weight limit: {weightShelfLife.toFixed(1)} days</p>
            )}
          </div>
        </div>
      </div>

      {/* Risk cards */}
      {hasData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-gray-500" />
              <p className="text-sm font-medium">Risk at 14 Days</p>
            </div>
            <div className="flex items-end gap-2">
              <p className={`text-2xl font-bold ${
                (riskAt14Days ?? 0) > 50 ? "text-red-600" :
                (riskAt14Days ?? 0) > 25 ? "text-amber-600" : "text-emerald-600"
              }`}>
                {riskAt14Days?.toFixed(1)}%
              </p>
              <StatusBadge status={
                (riskAt14Days ?? 0) > 50 ? "HIGH RISK" :
                (riskAt14Days ?? 0) > 25 ? "MODERATE" : "LOW RISK"
              } />
            </div>
          </div>
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-gray-500" />
              <p className="text-sm font-medium">Risk at 30 Days</p>
            </div>
            <div className="flex items-end gap-2">
              <p className={`text-2xl font-bold ${
                (riskAt30Days ?? 0) > 50 ? "text-red-600" :
                (riskAt30Days ?? 0) > 25 ? "text-amber-600" : "text-emerald-600"
              }`}>
                {riskAt30Days?.toFixed(1)}%
              </p>
              <StatusBadge status={
                (riskAt30Days ?? 0) > 50 ? "HIGH RISK" :
                (riskAt30Days ?? 0) > 25 ? "MODERATE" : "LOW RISK"
              } />
            </div>
          </div>
        </div>
      )}

      {/* Input summary */}
      {input && (
        <div className="bg-gray-50 border rounded-xl p-4">
          <p className="text-sm font-medium mb-2">Prediction Inputs</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Variety:</span>
              <span className="font-medium">{input.variety}</span>
            </div>
            <div className="flex items-center gap-2">
              <Thermometer className="h-3 w-3 text-gray-400" />
              <span className="text-gray-500">Pick temp:</span>
              <span className="font-medium">{input.pickTemp}°C</span>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="h-3 w-3 text-gray-400" />
              <span className="text-gray-500">Brix:</span>
              <span className="font-medium">{input.brix}</span>
            </div>
            <div className="flex items-center gap-2">
              <Scale className="h-3 w-3 text-gray-400" />
              <span className="text-gray-500">Freight:</span>
              <span className="font-medium">{input.freightType}</span>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Explanation */}
      {explanation.length > 0 && (
        <div className="bg-slate-50 border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-medium text-slate-700">How this prediction was made</p>
          </div>
          <ul className="space-y-1 text-sm text-slate-600">
            {explanation.map((e, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
