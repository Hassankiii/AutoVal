export interface ChartDataPoint {
  year: number;
  medianPrice: number | null;
  p25: number | null;
  p75: number | null;
  sampleSize: number;
  adjustedValue: number | null;
  isUserCar: boolean;
  isSparse: boolean;
}
