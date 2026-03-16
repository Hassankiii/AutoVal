export type ConditionKey = "excellent" | "good" | "fair" | "poor";
export type ConfidenceLevel = "high" | "medium" | "low";
export type FallbackTier = 0 | 1 | 2 | 3;

export interface ValuationInput {
  make: string;
  model: string;
  year: number;
  trim: string;
  mileage: number;
  condition: ConditionKey;
}

export interface ValuationResult {
  estimatedValue: number;
  basePrice: number;
  mileageAdjustment: number;
  conditionMultiplier: number;
  p25: number;
  p75: number;
  sampleSize: number;
  confidence: ConfidenceLevel;
  fallbackTier: FallbackTier;
  fallbackReason?: string;
}
