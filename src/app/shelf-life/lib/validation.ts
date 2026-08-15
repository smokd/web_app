///"use server";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePredictionInputs(data: {
  variety?: string;
  pickTemp?: number | null;
  brix?: number | null;
  freightType?: string;
  week?: number | null;
  packWeight?: number | null;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.variety || data.variety.trim() === "") {
    errors.push("Variety is required");
  }

  if (data.pickTemp === null || data.pickTemp === undefined || isNaN(data.pickTemp)) {
    errors.push("Pick temperature is required");
  } else {
    if (data.pickTemp < 0 || data.pickTemp > 55) {
      warnings.push(`Pick temperature (${data.pickTemp}°C) is outside normal range (0–55°C)`);
    }
    if (data.pickTemp > 40) {
      warnings.push("Extremely high pick temperature — prediction reliability reduced");
    }
  }

  if (data.brix === null || data.brix === undefined || isNaN(data.brix)) {
    errors.push("Brix is required");
  } else {
    if (data.brix < 5 || data.brix > 25) {
      warnings.push(`Brix (${data.brix}) is outside normal range (5–25)`);
    }
    if (data.brix < 10.5) {
      warnings.push("Low Brix — associated with shorter shelf life");
    }
  }

  if (!data.freightType || !["AIR", "SEA"].includes(data.freightType)) {
    errors.push("Freight type must be AIR or SEA");
  }

  if (data.week !== null && data.week !== undefined) {
    if (data.week < 1 || data.week > 53) {
      warnings.push(`Week ${data.week} is outside normal range`);
    }
  }

  if (data.packWeight !== null && data.packWeight !== undefined && data.packWeight <= 0) {
    errors.push("Pack weight must be greater than 0");
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateSampleDates(pickDate?: string | null, packDate?: string | null): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (pickDate && packDate) {
    const pick = new Date(pickDate);
    const pack = new Date(packDate);
    if (pack < pick) {
      errors.push("Pack date cannot be before pick date");
    }
    const daysDiff = (pack.getTime() - pick.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 7) {
      warnings.push(`Long delay (${Math.round(daysDiff)} days) between pick and pack`);
    }
  }

  const now = new Date();
  if (pickDate && new Date(pickDate) > now) {
    errors.push("Pick date cannot be in the future");
  }
  if (packDate && new Date(packDate) > now) {
    errors.push("Pack date cannot be in the future");
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateWeightReading(
  packWeight: number,
  weightGrams: number,
  previousWeight?: number | null
): { abnormal: boolean; warnings: string[] } {
  const warnings: string[] = [];
  let abnormal = false;

  if (weightGrams > packWeight * 1.02) {
    abnormal = true;
    warnings.push("Weight increased by more than 2% — possible measurement error");
  }

  if (previousWeight && previousWeight > 0) {
    const singleDayLoss = ((previousWeight - weightGrams) / previousWeight) * 100;
    if (singleDayLoss > 5) {
      abnormal = true;
      warnings.push(`Single-day loss of ${singleDayLoss.toFixed(1)}% exceeds 5% threshold`);
    }
  }

  return { abnormal, warnings };
}
