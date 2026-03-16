/**
 * Generates src/data/marketData.json from knowledge-based UAE market prices.
 * Run: npx tsx scripts/generateSeedData.ts
 */

import * as fs from "fs";
import * as path from "path";
import type { MarketData } from "../src/types/marketData";

const OUTPUT_PATH = path.join(__dirname, "..", "src", "data", "marketData.json");
const CURRENT_YEAR = 2025;
const START_YEAR = 2010;

// ─── Base prices (AED) for the CURRENT year model, brand-new equivalent ───────
// These reflect UAE Dubizzle asking prices for current-year used cars

interface ModelSeed {
  basePrice: number;          // 2025 market value (or latest year available)
  depreciationProfile: "luxury" | "premium" | "mainstream" | "american" | "icon";
  sampleSizeBase: number;     // How many listings typically available (newer = more)
}

const DEPRECIATION_PROFILES: Record<string, number[]> = {
  // Annual retention rate per year of age (year 1, 2, 3, 4, 5, 6, 7, 8, 9, 10+)
  luxury:      [0.82, 0.87, 0.88, 0.89, 0.90, 0.91, 0.92, 0.93, 0.94, 0.95],
  premium:     [0.83, 0.88, 0.89, 0.90, 0.91, 0.92, 0.93, 0.93, 0.94, 0.95],
  mainstream:  [0.84, 0.88, 0.89, 0.90, 0.91, 0.92, 0.93, 0.93, 0.94, 0.95],
  american:    [0.82, 0.86, 0.88, 0.89, 0.90, 0.91, 0.92, 0.93, 0.94, 0.95],
  icon:        [0.87, 0.90, 0.91, 0.92, 0.93, 0.93, 0.94, 0.94, 0.95, 0.96], // Land Cruiser, Patrol
};

const CATALOG: Record<string, Record<string, ModelSeed>> = {
  Toyota: {
    Camry:          { basePrice: 88000,  depreciationProfile: "mainstream", sampleSizeBase: 80 },
    Corolla:        { basePrice: 70000,  depreciationProfile: "mainstream", sampleSizeBase: 90 },
    "Land Cruiser": { basePrice: 340000, depreciationProfile: "icon",       sampleSizeBase: 50 },
    Prado:          { basePrice: 195000, depreciationProfile: "icon",       sampleSizeBase: 55 },
    Hilux:          { basePrice: 105000, depreciationProfile: "mainstream", sampleSizeBase: 40 },
    RAV4:           { basePrice: 128000, depreciationProfile: "mainstream", sampleSizeBase: 45 },
    Fortuner:       { basePrice: 138000, depreciationProfile: "mainstream", sampleSizeBase: 35 },
  },
  Nissan: {
    Patrol:         { basePrice: 248000, depreciationProfile: "icon",       sampleSizeBase: 70 },
    Altima:         { basePrice: 80000,  depreciationProfile: "mainstream", sampleSizeBase: 65 },
    Sunny:          { basePrice: 50000,  depreciationProfile: "mainstream", sampleSizeBase: 55 },
    "X-Trail":      { basePrice: 95000,  depreciationProfile: "mainstream", sampleSizeBase: 45 },
    Pathfinder:     { basePrice: 145000, depreciationProfile: "mainstream", sampleSizeBase: 35 },
    Navara:         { basePrice: 98000,  depreciationProfile: "mainstream", sampleSizeBase: 30 },
  },
  Honda: {
    Accord:         { basePrice: 105000, depreciationProfile: "mainstream", sampleSizeBase: 55 },
    Civic:          { basePrice: 85000,  depreciationProfile: "mainstream", sampleSizeBase: 60 },
    "CR-V":         { basePrice: 118000, depreciationProfile: "mainstream", sampleSizeBase: 40 },
    Pilot:          { basePrice: 155000, depreciationProfile: "mainstream", sampleSizeBase: 25 },
  },
  Lexus: {
    ES:             { basePrice: 195000, depreciationProfile: "luxury",     sampleSizeBase: 40 },
    LX:             { basePrice: 450000, depreciationProfile: "icon",       sampleSizeBase: 20 },
    RX:             { basePrice: 215000, depreciationProfile: "luxury",     sampleSizeBase: 35 },
    GX:             { basePrice: 265000, depreciationProfile: "luxury",     sampleSizeBase: 25 },
    IS:             { basePrice: 175000, depreciationProfile: "luxury",     sampleSizeBase: 30 },
  },
  BMW: {
    "3 Series":     { basePrice: 205000, depreciationProfile: "premium",    sampleSizeBase: 50 },
    "5 Series":     { basePrice: 262000, depreciationProfile: "premium",    sampleSizeBase: 40 },
    "7 Series":     { basePrice: 420000, depreciationProfile: "luxury",     sampleSizeBase: 20 },
    X5:             { basePrice: 385000, depreciationProfile: "premium",    sampleSizeBase: 30 },
    X3:             { basePrice: 238000, depreciationProfile: "premium",    sampleSizeBase: 35 },
  },
  "Mercedes-Benz": {
    "C-Class":      { basePrice: 218000, depreciationProfile: "premium",    sampleSizeBase: 55 },
    "E-Class":      { basePrice: 278000, depreciationProfile: "premium",    sampleSizeBase: 45 },
    "S-Class":      { basePrice: 550000, depreciationProfile: "luxury",     sampleSizeBase: 15 },
    GLE:            { basePrice: 385000, depreciationProfile: "premium",    sampleSizeBase: 30 },
    GLC:            { basePrice: 278000, depreciationProfile: "premium",    sampleSizeBase: 35 },
  },
  Audi: {
    A4:             { basePrice: 188000, depreciationProfile: "premium",    sampleSizeBase: 45 },
    A6:             { basePrice: 248000, depreciationProfile: "premium",    sampleSizeBase: 30 },
    Q5:             { basePrice: 228000, depreciationProfile: "premium",    sampleSizeBase: 35 },
    Q7:             { basePrice: 348000, depreciationProfile: "premium",    sampleSizeBase: 25 },
  },
  Volkswagen: {
    Tiguan:         { basePrice: 148000, depreciationProfile: "mainstream", sampleSizeBase: 35 },
    Passat:         { basePrice: 128000, depreciationProfile: "mainstream", sampleSizeBase: 30 },
    Touareg:        { basePrice: 248000, depreciationProfile: "premium",    sampleSizeBase: 20 },
  },
  Ford: {
    "F-150":        { basePrice: 175000, depreciationProfile: "american",   sampleSizeBase: 40 },
    Explorer:       { basePrice: 188000, depreciationProfile: "american",   sampleSizeBase: 35 },
    Expedition:     { basePrice: 248000, depreciationProfile: "american",   sampleSizeBase: 20 },
    Mustang:        { basePrice: 168000, depreciationProfile: "american",   sampleSizeBase: 25 },
  },
  Chevrolet: {
    Tahoe:          { basePrice: 268000, depreciationProfile: "american",   sampleSizeBase: 35 },
    Suburban:       { basePrice: 298000, depreciationProfile: "american",   sampleSizeBase: 25 },
    Camaro:         { basePrice: 148000, depreciationProfile: "american",   sampleSizeBase: 20 },
    Malibu:         { basePrice: 88000,  depreciationProfile: "american",   sampleSizeBase: 30 },
  },
  Dodge: {
    Charger:        { basePrice: 132000, depreciationProfile: "american",   sampleSizeBase: 35 },
    Challenger:     { basePrice: 138000, depreciationProfile: "american",   sampleSizeBase: 30 },
    Durango:        { basePrice: 188000, depreciationProfile: "american",   sampleSizeBase: 20 },
  },
  Hyundai: {
    Sonata:         { basePrice: 80000,  depreciationProfile: "mainstream", sampleSizeBase: 50 },
    Tucson:         { basePrice: 102000, depreciationProfile: "mainstream", sampleSizeBase: 45 },
    Elantra:        { basePrice: 72000,  depreciationProfile: "mainstream", sampleSizeBase: 55 },
    "Santa Fe":     { basePrice: 138000, depreciationProfile: "mainstream", sampleSizeBase: 35 },
    Palisade:       { basePrice: 178000, depreciationProfile: "mainstream", sampleSizeBase: 25 },
  },
  Kia: {
    Sportage:       { basePrice: 102000, depreciationProfile: "mainstream", sampleSizeBase: 45 },
    Sorento:        { basePrice: 138000, depreciationProfile: "mainstream", sampleSizeBase: 35 },
    Cerato:         { basePrice: 72000,  depreciationProfile: "mainstream", sampleSizeBase: 50 },
    Telluride:      { basePrice: 178000, depreciationProfile: "mainstream", sampleSizeBase: 20 },
  },
  Mitsubishi: {
    Pajero:         { basePrice: 125000, depreciationProfile: "mainstream", sampleSizeBase: 40 },
    Outlander:      { basePrice: 95000,  depreciationProfile: "mainstream", sampleSizeBase: 30 },
    "Eclipse Cross":{ basePrice: 88000,  depreciationProfile: "mainstream", sampleSizeBase: 25 },
  },
  "Land Rover": {
    Defender:       { basePrice: 310000, depreciationProfile: "luxury",     sampleSizeBase: 25 },
    Discovery:      { basePrice: 268000, depreciationProfile: "luxury",     sampleSizeBase: 20 },
    "Range Rover":  { basePrice: 520000, depreciationProfile: "luxury",     sampleSizeBase: 15 },
    "Range Rover Sport": { basePrice: 388000, depreciationProfile: "luxury", sampleSizeBase: 25 },
  },
  Porsche: {
    Cayenne:        { basePrice: 385000, depreciationProfile: "luxury",     sampleSizeBase: 20 },
    Panamera:       { basePrice: 365000, depreciationProfile: "luxury",     sampleSizeBase: 12 },
    Macan:          { basePrice: 248000, depreciationProfile: "luxury",     sampleSizeBase: 18 },
  },
  Genesis: {
    G80:            { basePrice: 225000, depreciationProfile: "premium",    sampleSizeBase: 15 },
    GV80:           { basePrice: 268000, depreciationProfile: "premium",    sampleSizeBase: 12 },
    G70:            { basePrice: 178000, depreciationProfile: "premium",    sampleSizeBase: 10 },
  },
};

function getPriceForYear(seed: ModelSeed, year: number): number {
  const age = CURRENT_YEAR - year;
  if (age < 0) return seed.basePrice;
  if (age === 0) return seed.basePrice;

  const rates = DEPRECIATION_PROFILES[seed.depreciationProfile];
  let price = seed.basePrice;

  for (let i = 0; i < age; i++) {
    const rateIndex = Math.min(i, rates.length - 1);
    price = price / rates[rateIndex]; // Reverse: going back in time means dividing
  }

  // Actually we want forward depreciation from basePrice (2025) backward
  // Reset: go forward in time from CURRENT_YEAR - age
  price = seed.basePrice;
  for (let i = 0; i < age; i++) {
    const rateIndex = Math.min(i, rates.length - 1);
    price = price * (1 / rates[rateIndex]); // invert: older cars were worth more when new
  }

  // Simpler approach: apply depreciation forward
  price = seed.basePrice;
  // Un-depreciate to get "original" price, then re-depreciate to target year
  // Actually, let's just work backwards from 2025 base
  price = seed.basePrice;
  for (let a = 0; a < age; a++) {
    const rateIndex = Math.min(a, rates.length - 1);
    // retention rate: price at age a+1 = price at age a * retention
    // We're going backwards: price at age a = price at age a+1 / retention
    price = price / rates[rateIndex];
  }

  return Math.round(price / 500) * 500; // Round to nearest 500 AED
}

// Better approach: compute forward from a "new price" anchor
function buildYearPrices(seed: ModelSeed): Record<string, number> {
  const rates = DEPRECIATION_PROFILES[seed.depreciationProfile];
  const result: Record<string, number> = {};

  // Start from base price at CURRENT_YEAR (2025) and work backwards
  // to get what older cars are worth NOW (their current used market value)
  // This means: price_2024 = price_2025 / retention_year1
  // price_2023 = price_2024 / retention_year2, etc.

  // basePrice is the current market value for a brand-new 2025 model.
  // Going to older years = applying depreciation (multiply by retention < 1).
  let price = seed.basePrice;
  result[String(CURRENT_YEAR)] = price;

  for (let year = CURRENT_YEAR - 1; year >= START_YEAR; year--) {
    const age = CURRENT_YEAR - year; // how old this car is today
    const rateIndex = Math.min(age - 1, rates.length - 1);
    // Each older year is worth less: multiply by the retention rate
    price = price * rates[rateIndex];
    result[String(year)] = Math.round(price / 500) * 500;
  }

  return result;
}

function getSampleSize(seed: ModelSeed, year: number): number {
  const age = CURRENT_YEAR - year;
  // Newer cars have fewer used listings, very old have fewer too
  if (age === 0) return Math.floor(seed.sampleSizeBase * 0.3);
  if (age === 1) return Math.floor(seed.sampleSizeBase * 0.6);
  if (age <= 3) return Math.floor(seed.sampleSizeBase * 0.85);
  if (age <= 7) return seed.sampleSizeBase;
  if (age <= 10) return Math.floor(seed.sampleSizeBase * 0.7);
  return Math.floor(seed.sampleSizeBase * 0.4);
}

function main() {
  const marketData: MarketData = {
    metadata: {
      scrapedAt: new Date().toISOString(),
      totalListings: 0,
      source: "knowledge-based-seed",
      version: "1.0.0",
    },
    makes: {},
  };

  let totalEntries = 0;

  for (const [make, models] of Object.entries(CATALOG)) {
    marketData.makes[make] = { models: {} };

    for (const [model, seed] of Object.entries(models)) {
      marketData.makes[make].models[model] = { years: {} };
      const yearPrices = buildYearPrices(seed);

      for (const [yearStr, medianPrice] of Object.entries(yearPrices)) {
        const year = Number(yearStr);
        const sampleSize = getSampleSize(seed, year);
        const spread = medianPrice * 0.12; // ±12% IQR spread

        marketData.makes[make].models[model].years[yearStr] = {
          medianPrice,
          sampleSize,
          p25: Math.round((medianPrice - spread * 0.6) / 500) * 500,
          p75: Math.round((medianPrice + spread * 0.6) / 500) * 500,
          minObserved: Math.round((medianPrice - spread) / 500) * 500,
          maxObserved: Math.round((medianPrice + spread) / 500) * 500,
          trims: {},
        };
        totalEntries++;
      }
    }
  }

  marketData.metadata.totalListings = totalEntries;

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(marketData, null, 2));
  console.log(`✓ Wrote ${totalEntries} year-entries across ${Object.keys(CATALOG).length} makes`);
  console.log(`  Output: ${OUTPUT_PATH}`);
}

main();
