"use server";

import prisma from "@/lib/prisma";
import { mean, median, percentile } from "./statistics";
import { classifyConfidence, type ConfidenceLevel } from "./risk";
import { getWeightCurve, calculateWeightShelfLife, interpolateWeightLoss } from "./weight-curve";
import { getTempRange, getTempAdjustmentFactor } from "./temperature";

export interface ShelfLifePrediction {
  predictedShelfLife: number | null;
  recommendedShelfLife: number | null;
  qualityShelfLife: number | null;
  weightShelfLife: number | null;
  limitingFactor: "QUALITY" | "WEIGHT_LOSS" | "INSUFFICIENT_DATA";
  confidence: ConfidenceLevel;
  sampleCount: number;
  riskAt14Days: number | null;
  riskAt30Days: number | null;
  predictedWeightLoss: Array<{
    day: number;
    lossPct: number;
    upper95LossPct: number | null;
  }>;
  warnings: string[];
  explanation: string[];
}

/**
 * Predict shelf life for a new sample based on variety, temperature, and Brix.
 *
 * Architecture:
 * 1. Quality model: descriptive survival analysis from historical failures
 * 2. Weight model: variety-specific weight-loss kinetics
 * 3. Combined: MIN(quality_limit, weight_limit) with conservative adjustment
 */
export async function predictShelfLife(
  variety: string,
  pickTemp: number,
  brix: number,
  freightType: string,
  week?: number | null,
  packWeight?: number | null
): Promise<ShelfLifePrediction> {
  const warnings: string[] = [];
  const explanation: string[] = [];

  // ─── 1. FETCH HISTORICAL DATA ───

  // All samples of this variety (any type, any status)
  const allSamples = await prisma.shelfLifeSample.findMany({
    where: { variety },
    select: {
      id: true,
      sampleType: true,
      status: true,
      totalDays: true,
      pickTemp: true,
      brix: true,
      observations: { select: { day: true, overallStatus: true } },
    },
  });

  const failedSamples = allSamples.filter((s) => s.status === "FAILED");
  const censoredSamples = allSamples.filter(
    (s) => s.status !== "FAILED" && s.totalDays !== null && s.totalDays > 0
  );

  const totalSampleCount = allSamples.length;
  const failedCount = failedSamples.length;

  explanation.push(`${totalSampleCount} historical ${variety} samples in database`);
  explanation.push(`${failedCount} failed, ${censoredSamples.length} right-censored`);

  // ─── 2. QUALITY MODEL ───

  let qualityShelfLife: number | null = null;

  if (failedCount >= 3) {
    // Use failed samples' failure days
    const failureDays = failedSamples
      .map((s) => s.totalDays)
      .filter((d): d is number => d !== null && d > 0);

    const medianFailure = median(failureDays);
    const p25Failure = percentile(failureDays, 25);

    if (medianFailure !== null && p25Failure !== null) {
      // Temperature adjustment
      const tempFactor = getTempAdjustmentFactor(pickTemp);
      const tempAdjustedMedian = medianFailure * tempFactor;
      const tempAdjustedP25 = p25Failure * tempFactor;

      // Brix adjustment (lower brix = shorter shelf life)
      let brixFactor = 1.0;
      if (brix < 10.5) {
        brixFactor = 0.9;
        warnings.push("Low Brix — quality shelf life reduced by 10%");
      } else if (brix > 14) {
        brixFactor = 1.05;
      }

      const adjustedMedian = tempAdjustedMedian * brixFactor;
      const adjustedP25 = tempAdjustedP25 * brixFactor;

      // Use P25 as conservative estimate, but cap at median
      qualityShelfLife = Math.min(adjustedP25, adjustedMedian);

      explanation.push(
        `Quality model: median failure ${medianFailure.toFixed(1)} days, ` +
        `temp-adjusted ${adjustedMedian.toFixed(1)} days, ` +
        `conservative (P25) ${adjustedP25.toFixed(1)} days`
      );
    }
  } else if (totalSampleCount >= 3) {
    // Not enough failures — use censored data as lower bounds
    const maxObservedDays = Math.max(
      ...allSamples.map((s) => s.totalDays || 0)
    );
    qualityShelfLife = maxObservedDays * 0.7; // Conservative discount
    warnings.push(
      `Only ${failedCount} failures observed — quality prediction is conservative`
    );
    explanation.push(
      `Quality model: insufficient failures (${failedCount}), ` +
      `using ${maxObservedDays} max observed days × 0.7 = ${qualityShelfLife.toFixed(1)}`
    );
  } else {
    warnings.push(`Only ${totalSampleCount} historical samples for ${variety} — quality prediction unreliable`);
    explanation.push("Quality model: insufficient data");
  }

  // ─── 3. WEIGHT MODEL ───

  const weightCurve = await getWeightCurve(variety);
  const weightLimit = calculateWeightShelfLife(weightCurve);
  const weightShelfLife = weightLimit.limitingDay;

  if (weightShelfLife !== null) {
    explanation.push(
      `Weight model: predicted 5% loss at day ${weightShelfLife.toFixed(1)} ` +
      `(10% at day ${(weightLimit.dayTo10Percent ?? 0).toFixed(1)})`
    );
  } else {
    warnings.push("Weight curve does not cross 5% loss threshold within 40 days");
    explanation.push("Weight model: no 5% crossing in 40-day curve");
  }

  // ─── 4. COMBINED PREDICTION ───

  let predictedShelfLife: number | null = null;
  let recommendedShelfLife: number | null = null;
  let limitingFactor: "QUALITY" | "WEIGHT_LOSS" | "INSUFFICIENT_DATA" = "INSUFFICIENT_DATA";

  if (qualityShelfLife !== null && weightShelfLife !== null) {
    predictedShelfLife = Math.min(qualityShelfLife, weightShelfLife);
    limitingFactor = qualityShelfLife <= weightShelfLife ? "QUALITY" : "WEIGHT_LOSS";
    explanation.push(
      `Combined: ${limitingFactor} is the limiting factor ` +
      `(${predictedShelfLife.toFixed(1)} days)`
    );
  } else if (qualityShelfLife !== null) {
    predictedShelfLife = qualityShelfLife;
    limitingFactor = "QUALITY";
    explanation.push(`Combined: quality model only (${predictedShelfLife.toFixed(1)} days)`);
  } else if (weightShelfLife !== null) {
    predictedShelfLife = weightShelfLife;
    limitingFactor = "WEIGHT_LOSS";
    explanation.push(`Combined: weight model only (${predictedShelfLife.toFixed(1)} days)`);
  }

  // Recommended = predicted minus safety margin
  if (predictedShelfLife !== null) {
    const safetyMargin = Math.max(1, predictedShelfLife * 0.15); // 15% or 1 day
    recommendedShelfLife = Math.max(1, predictedShelfLife - safetyMargin);
    explanation.push(
      `Recommended: ${predictedShelfLife.toFixed(1)} − ${safetyMargin.toFixed(1)} safety margin = ` +
      `${recommendedShelfLife.toFixed(1)} days`
    );
  }

  // ─── 5. CONFIDENCE ───

  const confidence = classifyConfidence(totalSampleCount);
  if (confidence === "LOW") {
    warnings.push("Low confidence — prediction based on limited historical data");
  }

  // ─── 6. RISK AT SPECIFIC DAYS ───

  let riskAt14Days: number | null = null;
  let riskAt30Days: number | null = null;

  if (predictedShelfLife !== null && predictedShelfLife > 0) {
    // Simple exponential decay model for risk
    // P(failure by day d) ≈ 1 - exp(-d / predictedShelfLife)
    riskAt14Days = Math.min(100, (1 - Math.exp(-14 / predictedShelfLife)) * 100);
    riskAt30Days = Math.min(100, (1 - Math.exp(-30 / predictedShelfLife)) * 100);

    explanation.push(
      `Risk model: ${riskAt14Days.toFixed(1)}% failure probability by day 14, ` +
      `${riskAt30Days.toFixed(1)}% by day 30`
    );
  }

  // ─── 7. WEIGHT LOSS PROJECTION (day 0–30) ───

  const predictedWeightLoss = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    const interpolated = interpolateWeightLoss(weightCurve, day);
    return {
      day,
      lossPct: interpolated?.lossPct ?? 0,
      upper95LossPct: interpolated?.upper95LossPct ?? null,
    };
  });

  // ─── 8. FREIGHT-SPECIFIC WARNINGS ───

  if (freightType === "SEA" && variety === "KIRRA") {
    warnings.push("KIRRA sea freight is classified as HIGH RISK — 14.5% overpack required");
  }

  if (pickTemp > 35) {
    warnings.push("Pick temperature >35°C — severe quality risk");
  } else if (pickTemp > 30) {
    warnings.push("Pick temperature >30°C — elevated quality risk");
  }

  return {
    predictedShelfLife,
    recommendedShelfLife,
    qualityShelfLife,
    weightShelfLife,
    limitingFactor,
    confidence,
    sampleCount: totalSampleCount,
    riskAt14Days,
    riskAt30Days,
    predictedWeightLoss,
    warnings,
    explanation,
  };
}


/**
 * Calculate overpack recommendation for a shipment.
 * Uses the shelf-life prediction model to estimate weight loss,
 * then computes required overpack percentage and weight.
 */
export async function calculateOverpackPrediction(params: {
  variety: string;
  freightType: string;
  pickTemp: number;
  week: number;
  brix: number;
  shipmentWeight: number;
}) {
  const { variety, freightType, pickTemp, week, brix, shipmentWeight } = params;

  // Run the main prediction model
  const prediction = await predictShelfLife(variety, pickTemp, brix, freightType, week, null);

  // Get the predicted weight loss at the end of the predicted shelf life
  const predictedDays = prediction.recommendedShelfLife ?? prediction.predictedShelfLife ?? 14;

  const weightLossAtDay = prediction.predictedWeightLoss.find(
    (w) => w.day === Math.round(predictedDays)
  ) ?? prediction.predictedWeightLoss[prediction.predictedWeightLoss.length - 1];

  const baseLossPct = weightLossAtDay?.lossPct ?? 2.5;

  // Freight-type risk multipliers
  const freightMultipliers: Record<string, number> = {
    AIR: 1.0,
    SEA: 1.25,
    ROAD: 1.1,
  };
  const freightMult = freightMultipliers[freightType] ?? 1.15;

  // Week aging factor (older fruit = more loss)
  const weekFactor = 1 + (week * 0.03);

  // Final predicted loss
  const totalLossPct = baseLossPct * freightMult * weekFactor;

  // Overpack = predicted loss + safety buffer (min 0.5%, max 5% cap)
  const safetyBuffer = 0.5;
  let overpackPct = totalLossPct + safetyBuffer;
  overpackPct = Math.max(0.5, Math.min(overpackPct, 5.0));

  const overpackWeight = Math.round((shipmentWeight * overpackPct) / 100);

  return {
    variety,
    freightType,
    pickTemp,
    week,
    brix,
    shipmentWeight,
    predictedShelfLifeDays: prediction.predictedShelfLife,
    recommendedShelfLifeDays: prediction.recommendedShelfLife,
    predictedWeightLossPercent: Number(totalLossPct.toFixed(2)),
    recommendedOverpackPercent: Number(overpackPct.toFixed(2)),
    recommendedOverpackWeight: overpackWeight,
    confidence: prediction.confidence,
    limitingFactor: prediction.limitingFactor,
    warnings: prediction.warnings,
    explanation: prediction.explanation,
  };
}


/**
 * Validate a historical sample against the prediction model.
 * Returns prediction error metrics for model validation.
 */
export async function validatePredictionAgainstSample(
  sampleId: string
): Promise<{
  variety: string;
  pickTemp: number | null;
  brix: number | null;
  freightType: string | null;
  predictedShelfLife: number | null;
  actualShelfLife: number | null;
  error: number | null;
  limitingFactor: string;
} | null> {
  const sample = await prisma.shelfLifeSample.findUnique({
    where: { id: sampleId },
    select: {
      variety: true,
      pickTemp: true,
      brix: true,
      freightType: true,
      totalDays: true,
      status: true,
    },
  });

  if (!sample || !sample.variety || sample.pickTemp === null || sample.brix === null) {
    return null;
  }

  const prediction = await predictShelfLife(
    sample.variety,
    sample.pickTemp,
    sample.brix,
    sample.freightType || "AIR",
    null,
    null
  );

  const actualShelfLife = sample.status === "FAILED" ? sample.totalDays : null;

  return {
    variety: sample.variety,
    pickTemp: sample.pickTemp,
    brix: sample.brix,
    freightType: sample.freightType,
    predictedShelfLife: prediction.predictedShelfLife,
    actualShelfLife,
    error: actualShelfLife !== null && prediction.predictedShelfLife !== null
      ? prediction.predictedShelfLife - actualShelfLife
      : null,
    limitingFactor: prediction.limitingFactor,
  };
}
