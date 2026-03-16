import { getYearData } from "./marketDataLoader";
import { getWithFallback, getCategoryFallback } from "./fallbackEngine";
import type { ValuationInput, ValuationResult, ConfidenceLevel } from "@/types/valuation";

// UAE average annual mileage (km)
const UAE_AVG_MILEAGE_PER_YEAR = 17500;

// Mileage adjustment: each 10k km above/below average per year = ±0.8%
const MILEAGE_ADJ_PER_10K = 0.008;
const MILEAGE_ADJ_CAP_POSITIVE = 0.15;  // max +15%
const MILEAGE_ADJ_FLOOR = 0.70;         // mileage factor floor

const CONDITION_MULTIPLIERS: Record<string, number> = {
  excellent: 1.08,
  good: 1.00,
  fair: 0.90,
  poor: 0.75,
};

export function getMileageAdjustment(
  mileage: number,
  year: number
): number {
  const currentYear = new Date().getFullYear();
  const age = Math.max(currentYear - year, 0);
  const expectedMileage = age * UAE_AVG_MILEAGE_PER_YEAR;
  const delta = mileage - expectedMileage;
  const deltaUnits = delta / 10_000;
  const rawAdj = -deltaUnits * MILEAGE_ADJ_PER_10K;
  const capped = Math.min(rawAdj, MILEAGE_ADJ_CAP_POSITIVE);
  return Math.max(1 + capped, MILEAGE_ADJ_FLOOR);
}

function getConfidence(sampleSize: number): ConfidenceLevel {
  if (sampleSize >= 20) return "high";
  if (sampleSize >= 5) return "medium";
  return "low";
}

export function computeValuation(input: ValuationInput): ValuationResult {
  const { make, model, year, trim, mileage, condition } = input;
  const currentYear = new Date().getFullYear();

  // 1. Lookup base price
  let basePrice: number;
  let sampleSize: number;
  let p25: number;
  let p75: number;
  let fallbackTier: ValuationResult["fallbackTier"] = 0;
  let fallbackReason: string | undefined;

  const yearData = getYearData(make, model, year);

  if (yearData && yearData.sampleSize >= 1) {
    // Use trim-specific price if available and user selected a trim
    const trimData = trim ? yearData.trims[trim] : null;
    basePrice = trimData ? trimData.medianPrice : yearData.medianPrice;
    sampleSize = trimData ? trimData.sampleSize : yearData.sampleSize;
    p25 = yearData.p25;
    p75 = yearData.p75;
  } else {
    // Try fallback
    const fallback =
      getWithFallback(make, model, year) ??
      getCategoryFallback(make, year);
    basePrice = fallback.price;
    sampleSize = 0;
    p25 = Math.round(basePrice * 0.9);
    p75 = Math.round(basePrice * 1.1);
    fallbackTier = fallback.tier;
    fallbackReason = fallback.reason;
  }

  // 2. Mileage adjustment
  const mileageFactor = getMileageAdjustment(mileage, year);
  const mileageAdjustment = mileageFactor - 1;

  // 3. Condition multiplier
  const conditionMultiplier = CONDITION_MULTIPLIERS[condition] ?? 1.0;

  // 4. Final value
  const rawValue = basePrice * mileageFactor * conditionMultiplier;
  const estimatedValue = Math.round(rawValue / 100) * 100;

  // Scale p25/p75 by condition+mileage proportionally
  const scaleFactor = mileageFactor * conditionMultiplier;
  const adjustedP25 = Math.round((p25 * scaleFactor) / 100) * 100;
  const adjustedP75 = Math.round((p75 * scaleFactor) / 100) * 100;

  return {
    estimatedValue,
    basePrice,
    mileageAdjustment,
    conditionMultiplier,
    p25: adjustedP25,
    p75: adjustedP75,
    sampleSize,
    confidence: getConfidence(sampleSize),
    fallbackTier,
    fallbackReason,
  };
}
