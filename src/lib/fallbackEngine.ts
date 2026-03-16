import { getModelData, getYearData } from "./marketDataLoader";
import type { FallbackTier } from "@/types/valuation";

// UAE market depreciation rates by age (fallback when real data is missing)
const DEPRECIATION_RATES: { maxAge: number; rate: number }[] = [
  { maxAge: 1, rate: 0.15 },
  { maxAge: 3, rate: 0.12 },
  { maxAge: 6, rate: 0.08 },
  { maxAge: 10, rate: 0.05 },
  { maxAge: Infinity, rate: 0.03 },
];

function getDepreciationRate(age: number): number {
  return (
    DEPRECIATION_RATES.find((r) => age <= r.maxAge)?.rate ??
    DEPRECIATION_RATES[DEPRECIATION_RATES.length - 1].rate
  );
}

/** Apply depreciation curve from an anchor price at anchorYear to targetYear */
export function extrapolatePrice(
  anchorPrice: number,
  anchorYear: number,
  targetYear: number
): number {
  let price = anchorPrice;
  if (targetYear === anchorYear) return price;

  if (targetYear < anchorYear) {
    // Going backward in time — un-depreciate
    const steps = anchorYear - targetYear;
    for (let i = 0; i < steps; i++) {
      const age = anchorYear - targetYear - i;
      price = price / (1 - getDepreciationRate(age));
    }
  } else {
    // Going forward in time — depreciate
    const currentYear = new Date().getFullYear();
    const anchorAge = anchorYear < currentYear ? currentYear - anchorYear : 0;
    for (let y = anchorYear + 1; y <= targetYear; y++) {
      const age = anchorAge + (y - anchorYear);
      price = price * (1 - getDepreciationRate(age));
    }
  }
  return Math.round(price);
}

interface FallbackResult {
  price: number;
  tier: FallbackTier;
  reason: string;
}

export function getWithFallback(
  make: string,
  model: string,
  year: number
): FallbackResult | null {
  const modelData = getModelData(make, model);
  if (!modelData) return null;

  const years = Object.keys(modelData.years).map(Number);
  if (years.length === 0) return null;

  // Tier 1: interpolate from adjacent years
  const prevYear = Math.max(...years.filter((y) => y < year));
  const nextYear = Math.min(...years.filter((y) => y > year));
  const hasPrev = isFinite(prevYear) && prevYear > 0;
  const hasNext = isFinite(nextYear) && nextYear < Infinity;

  if (hasPrev && hasNext) {
    const p1 = getYearData(make, model, prevYear)!.medianPrice;
    const p2 = getYearData(make, model, nextYear)!.medianPrice;
    const fraction = (year - prevYear) / (nextYear - prevYear);
    const interpolated = Math.round(p1 + (p2 - p1) * fraction);
    return {
      price: interpolated,
      tier: 1,
      reason: `Interpolated between ${prevYear} and ${nextYear} data`,
    };
  }

  // Tier 2: extrapolate from nearest anchor
  const anchorYear = hasPrev ? prevYear : hasNext ? nextYear : null;
  if (anchorYear !== null) {
    const anchorPrice = getYearData(make, model, anchorYear)!.medianPrice;
    return {
      price: extrapolatePrice(anchorPrice, anchorYear, year),
      tier: 2,
      reason: `Extrapolated from ${anchorYear} data using UAE depreciation curve`,
    };
  }

  return null;
}

// Category average price estimates (last-resort fallback)
const CATEGORY_BASE_PRICES: Record<string, number> = {
  Toyota: 85000,
  Nissan: 90000,
  Honda: 75000,
  Lexus: 200000,
  BMW: 220000,
  "Mercedes-Benz": 240000,
  Audi: 200000,
  Volkswagen: 110000,
  Ford: 130000,
  Chevrolet: 150000,
  Dodge: 120000,
  Hyundai: 80000,
  Kia: 85000,
  Genesis: 200000,
  Mitsubishi: 70000,
  "Land Rover": 300000,
  Porsche: 400000,
};

const CATEGORY_BASE_YEAR = 2024;

export function getCategoryFallback(
  make: string,
  year: number
): FallbackResult {
  const base = CATEGORY_BASE_PRICES[make] ?? 90000;
  return {
    price: extrapolatePrice(base, CATEGORY_BASE_YEAR, year),
    tier: 3,
    reason: `No market data — using ${make} category average`,
  };
}
