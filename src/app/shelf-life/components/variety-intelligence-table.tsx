"use client";

import { StatusBadge } from "./status-badge";
import { Trophy, AlertTriangle, TrendingUp } from "lucide-react";

interface VarietyProfile {
  variety: string;
  sampleCount: number;
  avgShelfLife: number;
  failureRate: number;
  avgBrix: number;
  avgPickTemp: number;
  riskLevelAir: string;
  riskLevelSea: string;
  recommendedAirOverpack: number;
  recommendedSeaOverpack: number;
}

interface VarietyIntelligenceTableProps {
  profiles: VarietyProfile[];
}

export function VarietyIntelligenceTable({ profiles }: VarietyIntelligenceTableProps) {
  if (!profiles.length) return null;

  // Find best, highest risk, most variable
  const best = profiles.reduce((a, b) =>
    (a.avgShelfLife || 0) > (b.avgShelfLife || 0) && a.sampleCount >= 5 ? a : b
  );
  const highestRisk = profiles.reduce((a, b) =>
    (a.failureRate || 0) > (b.failureRate || 0) ? a : b
  );

  return (
    <div className="space-y-4">
      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-3">
          <Trophy className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800">Best Performing</p>
            <p className="text-xs text-emerald-600">
              {best.variety} — {best.avgShelfLife?.toFixed(1)} days avg
              {best.sampleCount < 5 && " (limited data)"}
            </p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Highest Risk</p>
            <p className="text-xs text-red-600">
              {highestRisk.variety} — {(highestRisk.failureRate * 100).toFixed(0)}% failure rate
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2 pr-4">Variety</th>
              <th className="py-2 pr-4 text-right">Samples</th>
              <th className="py-2 pr-4 text-right">Avg Shelf Life</th>
              <th className="py-2 pr-4 text-right">Failure Rate</th>
              <th className="py-2 pr-4 text-right">Avg Brix</th>
              <th className="py-2 pr-4 text-right">Avg Pick Temp</th>
              <th className="py-2 pr-4">Air Risk</th>
              <th className="py-2 pr-4">Sea Risk</th>
              <th className="py-2 pr-4 text-right">Air OP%</th>
              <th className="py-2 pr-4 text-right">Sea OP%</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.variety} className="border-b hover:bg-gray-50">
                <td className="py-2 pr-4 font-medium">{p.variety}</td>
                <td className="py-2 pr-4 text-right">{p.sampleCount}</td>
                <td className="py-2 pr-4 text-right">
                  {p.avgShelfLife ? `${p.avgShelfLife.toFixed(1)}d` : "—"}
                </td>
                <td className="py-2 pr-4 text-right">
                  {p.failureRate ? `${(p.failureRate * 100).toFixed(0)}%` : "—"}
                </td>
                <td className="py-2 pr-4 text-right">
                  {p.avgBrix ? p.avgBrix.toFixed(1) : "—"}
                </td>
                <td className="py-2 pr-4 text-right">
                  {p.avgPickTemp ? `${p.avgPickTemp.toFixed(1)}°C` : "—"}
                </td>
                <td className="py-2 pr-4"><StatusBadge status={p.riskLevelAir || "LOW RISK"} /></td>
                <td className="py-2 pr-4"><StatusBadge status={p.riskLevelSea || "LOW RISK"} /></td>
                <td className="py-2 pr-4 text-right">{p.recommendedAirOverpack ?? "—"}%</td>
                <td className="py-2 pr-4 text-right">{p.recommendedSeaOverpack ?? "—"}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
