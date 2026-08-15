"use client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-blue-100 text-blue-800 border-blue-200",
    APPROACHING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    FAILED: "bg-red-100 text-red-800 border-red-200",
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
    GOOD: "bg-emerald-100 text-emerald-800 border-emerald-200",
    FAIR: "bg-amber-100 text-amber-800 border-amber-200",
    "LOW RISK": "bg-green-100 text-green-800 border-green-200",
    MODERATE: "bg-yellow-100 text-yellow-800 border-yellow-200",
    "HIGH RISK": "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        styles[status] || "bg-gray-100 text-gray-800 border-gray-200",
        className
      )}
    >
      {status}
    </span>
  );
}
