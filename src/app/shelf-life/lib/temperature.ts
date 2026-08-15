///"use server";

import prisma from "@/lib/prisma";

export interface TempImpact {
  tempRange: string;
  avgShelfLife: number | null;
  failureRate: number | null;
  sampleCount: number | null;
}

export async function getTempImpact(): Promise<TempImpact[]> {
  return prisma.shelfLifeTempImpact.findMany({
    orderBy: { avgShelfLife: "desc" },
  });
}

export function getTempRange(pickTemp: number): string {
  if (pickTemp < 25) return "<25C";
  if (pickTemp < 30) return "25-30C";
  if (pickTemp < 35) return "30-35C";
  if (pickTemp <= 40) return "35-40C";
  return ">40C";
}

export function getTempAdjustmentFactor(pickTemp: number): number {
  // Returns a multiplier for shelf life based on temperature
  // Higher temp = shorter shelf life = lower multiplier
  if (pickTemp < 25) return 1.0;
  if (pickTemp < 30) return 0.85;
  if (pickTemp < 35) return 0.75;
  if (pickTemp <= 40) return 0.65;
  return 0.5;
}

export function getTempImpactForRange(
  impacts: TempImpact[],
  range: string
): TempImpact | undefined {
  return impacts.find((i) => i.tempRange === range);
}
