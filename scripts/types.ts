export interface RawListing {
  make: string;
  model: string;
  year: number;
  trim: string | null;
  mileage: number | null;
  price: number;
  condition: string | null;
  url?: string;
}

export interface ScrapeReport {
  startedAt: string;
  finishedAt: string;
  totalCollected: number;
  byMakeModel: Record<string, { collected: number; error?: string }>;
}
