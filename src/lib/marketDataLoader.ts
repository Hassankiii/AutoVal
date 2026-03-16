import type { MarketData, YearData, ModelData } from "@/types/marketData";

// Static import — bundled at build time, zero runtime latency
let marketData: MarketData | null = null;

function getData(): MarketData {
  if (!marketData) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      marketData = require("@/data/marketData.json") as MarketData;
    } catch {
      // Return empty data if the JSON hasn't been generated yet
      marketData = {
        metadata: {
          scrapedAt: "",
          totalListings: 0,
          source: "none",
          version: "0",
        },
        makes: {},
      };
    }
  }
  return marketData!;
}

export function getAvailableMakes(): string[] {
  return Object.keys(getData().makes).sort();
}

export function getAvailableModels(make: string): string[] {
  return Object.keys(getData().makes[make]?.models ?? {}).sort();
}

export function getModelYears(make: string, model: string): number[] {
  const years = Object.keys(
    getData().makes[make]?.models[model]?.years ?? {}
  ).map(Number);
  return years.sort((a, b) => b - a); // newest first
}

export function getAvailableTrims(
  make: string,
  model: string,
  year: number
): string[] {
  const yearData = getYearData(make, model, year);
  if (!yearData) return [];
  return Object.keys(yearData.trims).sort();
}

export function getYearData(
  make: string,
  model: string,
  year: number
): YearData | null {
  return getData().makes[make]?.models[model]?.years[String(year)] ?? null;
}

export function getModelData(
  make: string,
  model: string
): ModelData | null {
  return getData().makes[make]?.models[model] ?? null;
}

export function getMetadata() {
  return getData().metadata;
}

export function hasData(): boolean {
  return Object.keys(getData().makes).length > 0;
}
