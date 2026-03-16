export interface TrimData {
  medianPrice: number;
  sampleSize: number;
}

export interface YearData {
  medianPrice: number;
  sampleSize: number;
  p25: number;
  p75: number;
  minObserved: number;
  maxObserved: number;
  trims: Record<string, TrimData>;
}

export interface ModelData {
  years: Record<string, YearData>;
}

export interface MakeData {
  models: Record<string, ModelData>;
}

export interface MarketDataMetadata {
  scrapedAt: string;
  totalListings: number;
  source: string;
  version: string;
}

export interface MarketData {
  metadata: MarketDataMetadata;
  makes: Record<string, MakeData>;
}
