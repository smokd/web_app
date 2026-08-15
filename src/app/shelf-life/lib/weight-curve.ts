///"use server";

import prisma from "@/lib/prisma";
import { findThresholdDay, interpolate } from "./statistics";

export interface WeightPrediction {
  day: number;
  lossPct: number;
  upper95LossPct: number | null;
}

export interface WeightShelfLife {
  dayTo5Percent: number | null;
  dayTo10Percent: number | null;
  limitingDay: number | null;
}

export async function getWeightCurve(variety: string): Promise<WeightPrediction[]> {
  const curves = await prisma.shelfLifeWeightCurve.findMany({
    where: { variety },
    orderBy: { day: "asc" },
  });

  return curves.map((c) => ({
    day: c.day,
    lossPct: c.predictedLossPct,
    upper95LossPct: c.upper95LossPct,
  }));
}

export function calculateWeightShelfLife(curve: WeightPrediction[]): WeightShelfLife {
  const dayTo5 = findThresholdDay(
    curve.map((c) => ({ day: c.day, value: c.lossPct })),
    5
  );
  const dayTo10 = findThresholdDay(
    curve.map((c) => ({ day: c.day, value: c.lossPct })),
    10
  );

  // Use 5% as the primary weight limit (conservative)
  return {
    dayTo5Percent: dayTo5,
    dayTo10Percent: dayTo10,
    limitingDay: dayTo5,
  };
}

export function interpolateWeightLoss(
  curve: WeightPrediction[],
  day: number
): { lossPct: number; upper95LossPct: number | null } | null {
  const exact = curve.find((c) => c.day === day);
  if (exact) return { lossPct: exact.lossPct, upper95LossPct: exact.upper95LossPct };

  // Find bracketing days
  const lower = curve.filter((c) => c.day < day).pop();
  const upper = curve.find((c) => c.day > day);
  if (!lower || !upper) return null;

  return {
    lossPct: interpolate(day, lower.day, upper.day, lower.lossPct, upper.lossPct),
    upper95LossPct: lower.upper95LossPct && upper.upper95LossPct
      ? interpolate(day, lower.day, upper.day, lower.upper95LossPct, upper.upper95LossPct)
      : null,
  };
}
