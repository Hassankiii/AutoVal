/**
 * Processes rawListings.json → src/data/marketData.json
 *
 * Usage:
 *   npx tsx scripts/processData.ts
 *
 * Steps:
 *   1. Normalize and filter raw listings
 *   2. Group by make + model + year
 *   3. IQR outlier removal per group
 *   4. Compute median, p25, p75
 *   5. Trim sub-grouping if enough data
 *   6. Write src/data/marketData.json
 */

import * as fs from "fs";
import * as path from "path";
import type { RawListing } from "./types";
import type { MarketData, YearData } from "../src/types/marketData";

const INPUT_PATH = path.join(__dirname, "output", "rawListings.json");
const OUTPUT_PATH = path.join(__dirname, "..", "src", "data", "marketData.json");

const CURRENT_YEAR = new Date().getFullYear();

// ─── Normalize ────────────────────────────────────────────────────────────────

function normalize(listing: RawListing): RawListing | null {
  const price = listing.price;
  if (!price || price < 5000 || price > 2_000_000) return null;
  const year = listing.year;
  if (!year || year < 1990 || year > CURRENT_YEAR + 1) return null;
  const mileage =
    listing.mileage != null && listing.mileage >= 0 && listing.mileage < 500_000
      ? listing.mileage
      : null;
  return { ...listing, mileage };
}

// ─── Statistics ───────────────────────────────────────────────────────────────

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function median(sorted: number[]): number {
  return percentile(sorted, 50);
}

function iqrFilter(prices: number[]): number[] {
  if (prices.length < 5) return prices; // too few — skip IQR
  const sorted = [...prices].sort((a, b) => a - b);
  const q1 = percentile(sorted, 25);
  const q3 = percentile(sorted, 75);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return sorted.filter((p) => p >= lower && p <= upper);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function buildYearData(listings: RawListing[]): YearData {
  const rawPrices = listings.map((l) => l.price);
  const filtered = iqrFilter(rawPrices);
  const sorted = [...filtered].sort((a, b) => a - b);

  const med = Math.round(median(sorted));
  const p25 = Math.round(percentile(sorted, 25));
  const p75 = Math.round(percentile(sorted, 75));
  const minObserved = sorted[0] ?? med;
  const maxObserved = sorted[sorted.length - 1] ?? med;

  // Trim sub-grouping: only if > 30% of listings have trim data
  const withTrim = listings.filter((l) => l.trim && l.trim.trim() !== "");
  const trims: YearData["trims"] = {};
  if (withTrim.length / listings.length > 0.3) {
    const trimGroups = new Map<string, RawListing[]>();
    for (const l of withTrim) {
      const key = l.trim!.trim();
      if (!trimGroups.has(key)) trimGroups.set(key, []);
      trimGroups.get(key)!.push(l);
    }
    for (const [trimName, trimListings] of trimGroups) {
      if (trimListings.length < 3) continue;
      const trimPrices = iqrFilter(trimListings.map((l) => l.price)).sort(
        (a, b) => a - b
      );
      trims[trimName] = {
        medianPrice: Math.round(median(trimPrices)),
        sampleSize: trimPrices.length,
      };
    }
  }

  return {
    medianPrice: med,
    sampleSize: sorted.length,
    p25,
    p75,
    minObserved,
    maxObserved,
    trims,
  };
}

function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`Input file not found: ${INPUT_PATH}`);
    console.error("Run: npx tsx scripts/scrape.ts first");
    process.exit(1);
  }

  const raw: RawListing[] = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));
  console.log(`Loaded ${raw.length} raw listings`);

  // Normalize
  const normalized = raw
    .map(normalize)
    .filter((l): l is RawListing => l !== null);
  console.log(`After normalization: ${normalized.length} listings`);

  // Group by make + model + year
  const groups = new Map<string, RawListing[]>();
  for (const listing of normalized) {
    const key = `${listing.make}|||${listing.model}|||${listing.year}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(listing);
  }

  // Build market data
  const marketData: MarketData = {
    metadata: {
      scrapedAt: new Date().toISOString(),
      totalListings: normalized.length,
      source: "dubizzle-uae",
      version: "1.0.0",
    },
    makes: {},
  };

  let sparseCount = 0;
  let totalGroups = 0;

  for (const [key, listings] of groups) {
    const [make, model, yearStr] = key.split("|||");
    const year = yearStr;

    if (!marketData.makes[make]) {
      marketData.makes[make] = { models: {} };
    }
    if (!marketData.makes[make].models[model]) {
      marketData.makes[make].models[model] = { years: {} };
    }

    const yearData = buildYearData(listings);
    marketData.makes[make].models[model].years[year] = yearData;

    totalGroups++;
    if (yearData.sampleSize < 5) sparseCount++;
  }

  // Ensure output directory exists
  const outDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(marketData, null, 2));

  console.log(`\n✓ marketData.json written to: ${OUTPUT_PATH}`);
  console.log(`  Total groups (make/model/year): ${totalGroups}`);
  console.log(`  Sparse groups (< 5 listings):   ${sparseCount}`);

  // Summary by make
  console.log(`\nMakes covered:`);
  for (const make of Object.keys(marketData.makes)) {
    const modelCount = Object.keys(marketData.makes[make].models).length;
    console.log(`  ${make}: ${modelCount} models`);
  }

  console.log(`\nNext: commit src/data/marketData.json and run npm run dev`);
}

main();
