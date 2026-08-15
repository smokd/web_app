"use client";

import { Activity, AlertTriangle, Clock } from "lucide-react";

interface SampleStatsCardsProps {
  activeCount: number;
  failedThisWeek: number;
  avgShelfLife: number;
}

export function SampleStatsCards({ activeCount, failedThisWeek, avgShelfLife }: SampleStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
          <Activity className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Active Samples</p>
          <p className="text-2xl font-bold">{activeCount}</p>
        </div>
      </div>
      <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Failed This Week</p>
          <p className="text-2xl font-bold">{failedThisWeek}</p>
        </div>
      </div>
      <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
          <Clock className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Avg Shelf Life</p>
          <p className="text-2xl font-bold">{avgShelfLife.toFixed(1)} days</p>
        </div>
      </div>
    </div>
  );
}
