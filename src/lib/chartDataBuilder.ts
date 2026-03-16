import { getModelData, getYearData } from "./marketDataLoader";
import { getMileageAdjustment } from "./valuationEngine";
import { extrapolatePrice } from "./fallbackEngine";
import type { ValuationInput, ValuationResult } from "@/types/valuation";
import type { ChartDataPoint } from "@/types/chart";

const CONDITION_MULTIPLIERS: Record<string, number> = {
  excellent: 1.08,
  good: 1.00,
  fair: 0.90,
  poor: 0.75,
};

export function buildDepreciationSeries(
  make: string,
  model: string,
  input: ValuationInput,
  result: ValuationResult
): ChartDataPoint[] {
  const currentYear = new Date().getFullYear();
  const modelData = getModelData(make, model);

  // Build set of years with real data
  const realYears = new Set<number>();
  if (modelData) {
    for (const yr of Object.keys(modelData.years)) {
      realYears.add(Number(yr));
    }
  }

  // Chart range: earliest real year to current year (capped at 20 years back)
  const minRealYear = realYears.size > 0 ? Math.min(...realYears) : currentYear - 10;
  const chartStart = Math.max(minRealYear, currentYear - 15);
  const chartEnd = currentYear;

  const conditionMultiplier = CONDITION_MULTIPLIERS[input.condition] ?? 1.0;
  const points: ChartDataPoint[] = [];

  for (let yr = chartStart; yr <= chartEnd; yr++) {
    const yearData = getYearData(make, model, yr);
    const isUserCar = yr === input.year;

    if (yearData && yearData.sampleSize >= 1) {
      // Real data point
      const mileageFactor = getMileageAdjustment(input.mileage, input.year);
      // For non-user years, show median only (no mileage/condition)
      const adjustedValue = isUserCar
        ? result.estimatedValue
        : null;

      points.push({
        year: yr,
        medianPrice: yearData.medianPrice,
        p25: yearData.p25,
        p75: yearData.p75,
        sampleSize: yearData.sampleSize,
        adjustedValue,
        isUserCar,
        isSparse: yearData.sampleSize < 5,
      });
    } else {
      // Fill gap with extrapolated value from nearest real anchor
      const nearestYear = findNearestRealYear(realYears, yr);
      if (nearestYear !== null) {
        const anchorData = getYearData(make, model, nearestYear)!;
        const extrapolated = extrapolatePrice(
          anchorData.medianPrice,
          nearestYear,
          yr
        );
        points.push({
          year: yr,
          medianPrice: extrapolated,
          p25: Math.round(extrapolated * 0.88),
          p75: Math.round(extrapolated * 1.12),
          sampleSize: 0,
          adjustedValue: isUserCar ? result.estimatedValue : null,
          isUserCar,
          isSparse: true,
        });
      }
    }
  }

  // Ensure user's car year is always in the series
  if (!points.find((p) => p.year === input.year)) {
    points.push({
      year: input.year,
      medianPrice: result.basePrice,
      p25: result.p25,
      p75: result.p75,
      sampleSize: result.sampleSize,
      adjustedValue: result.estimatedValue,
      isUserCar: true,
      isSparse: result.sampleSize < 5,
    });
    points.sort((a, b) => a.year - b.year);
  }

  return points;
}

function findNearestRealYear(
  realYears: Set<number>,
  targetYear: number
): number | null {
  let nearest: number | null = null;
  let minDist = Infinity;
  for (const yr of realYears) {
    const dist = Math.abs(yr - targetYear);
    if (dist < minDist) {
      minDist = dist;
      nearest = yr;
    }
  }
  return nearest;
}
