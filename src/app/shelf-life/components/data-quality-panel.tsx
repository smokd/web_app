"use client";

import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface DataQualityIssue {
  sampleId: string;
  type: "error" | "warning";
  message: string;
}

interface DataQualityPanelProps {
  totalSamples: number;
  issues: DataQualityIssue[];
}

export function DataQualityPanel({ totalSamples, issues }: DataQualityPanelProps) {
  const errors = issues.filter((i) => i.type === "error");
  const warnings = issues.filter((i) => i.type === "warning");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{totalSamples}</p>
          <p className="text-xs text-gray-500">Total Samples</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-700">{errors.length}</p>
          <p className="text-xs text-red-600">Errors</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{warnings.length}</p>
          <p className="text-xs text-amber-600">Warnings</p>
        </div>
      </div>

      {issues.length > 0 && (
        <div className="max-h-64 overflow-y-auto border rounded-lg">
          {issues.map((issue, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 px-3 py-2 text-sm ${
                i !== issues.length - 1 ? "border-b" : ""
              } ${issue.type === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}
            >
              {issue.type === "error" ? (
                <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-medium">{issue.sampleId}</span>
                <span className="text-gray-500 mx-1">—</span>
                <span>{issue.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {issues.length === 0 && (
        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm">
          <CheckCircle className="h-4 w-4" />
          <span>No data quality issues detected</span>
        </div>
      )}
    </div>
  );
}
