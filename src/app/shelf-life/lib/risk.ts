///"use server";

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "INSUFFICIENT_DATA";
export type ConfidenceLevel = "HIGH" | "MODERATE" | "LOW";

export function classifyRisk(
  currentDay: number,
  predictedShelfLife: number | null,
  confidence: ConfidenceLevel
): { displayStatus: string; riskLevel: RiskLevel; remainingDays: number | null } {
  if (confidence === "LOW" || predictedShelfLife === null) {
    return { displayStatus: "INSUFFICIENT_DATA", riskLevel: "INSUFFICIENT_DATA", remainingDays: null };
  }

  const remaining = predictedShelfLife - currentDay;

  if (remaining < 0) {
    return { displayStatus: "FAILED", riskLevel: "HIGH", remainingDays: remaining };
  }
  if (remaining <= 2) {
    return { displayStatus: "APPROACHING", riskLevel: "HIGH", remainingDays: remaining };
  }
  if (remaining <= 5) {
    return { displayStatus: "ACTIVE", riskLevel: "MODERATE", remainingDays: remaining };
  }
  return { displayStatus: "ACTIVE", riskLevel: "LOW", remainingDays: remaining };
}

export function classifyConfidence(sampleCount: number): ConfidenceLevel {
  if (sampleCount >= 20) return "HIGH";
  if (sampleCount >= 8) return "MODERATE";
  return "LOW";
}

export function riskFromOverpack(riskLevel: string): RiskLevel {
  if (riskLevel === "HIGH RISK") return "HIGH";
  if (riskLevel === "MODERATE") return "MODERATE";
  return "LOW";
}
