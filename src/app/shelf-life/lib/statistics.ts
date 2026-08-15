///"use server";

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  if (upper >= sorted.length) return sorted[lower];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function stdDev(values: number[]): number | null {
  if (values.length < 2) return null;
  const m = mean(values);
  if (m === null) return null;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function mae(predicted: number[], actual: number[]): number | null {
  if (predicted.length !== actual.length || predicted.length === 0) return null;
  return mean(predicted.map((p, i) => Math.abs(p - actual[i])))!;
}

export function rmse(predicted: number[], actual: number[]): number | null {
  if (predicted.length !== actual.length || predicted.length === 0) return null;
  const squaredErrors = predicted.map((p, i) => Math.pow(p - actual[i], 2));
  return Math.sqrt(mean(squaredErrors)!);
}

export function bias(predicted: number[], actual: number[]): number | null {
  if (predicted.length !== actual.length || predicted.length === 0) return null;
  return mean(predicted.map((p, i) => p - actual[i]))!;
}

/** Linear interpolation between two points */
export function interpolate(x: number, x0: number, x1: number, y0: number, y1: number): number {
  if (x1 === x0) return y0;
  return y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);
}

/** Find the day where a value crosses a threshold using linear interpolation */
export function findThresholdDay(
  data: Array<{ day: number; value: number }>,
  threshold: number
): number | null {
  for (let i = 0; i < data.length - 1; i++) {
    const curr = data[i];
    const next = data[i + 1];
    if (curr.value < threshold && next.value >= threshold) {
      return interpolate(threshold, curr.value, next.value, curr.day, next.day);
    }
  }
  return null;
}
