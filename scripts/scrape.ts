/**
 * One-time Dubizzle UAE scraper.
 *
 * Usage:
 *   npx tsx scripts/scrape.ts
 *
 * BEFORE running:
 *   1. Open https://uae.dubizzle.com/motors/used-cars/?make=toyota&model=camry
 *      in Chrome DevTools → Network → XHR/Fetch
 *   2. Find the API request that returns listing JSON (look for URLs containing
 *      "api" or "listings" or "motors")
 *   3. Update API_URL_PATTERN below to match what you see
 *
 * Output:
 *   scripts/output/rawListings.json   — flat array of RawListing[]
 *   scripts/output/scrapeReport.json  — per-make/model counts + errors
 */

import { chromium, Page, Response } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { SCRAPE_TARGETS, SCRAPE_CONFIG } from "./scrapeConfig";
import type { RawListing, ScrapeReport } from "./types";

// ─── UPDATE THIS PATTERN after inspecting DevTools Network tab ───────────────
// It should match the URL of the XHR/fetch request that returns listing JSON.
// Examples:
//   /api/v1/listings/  →  "api/v1/listings"
//   /motors/search/    →  "motors/search"
const API_URL_PATTERN = "dubizzle.com";
// ─────────────────────────────────────────────────────────────────────────────

const OUTPUT_DIR = path.join(__dirname, "output");

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Try to extract listings from an intercepted API response JSON.
 * Dubizzle may nest results differently — adjust the path if needed.
 */
function extractListingsFromJson(
  json: Record<string, unknown>,
  make: string,
  model: string
): RawListing[] {
  // Common Dubizzle response shapes — try each:
  const candidates: unknown[] =
    (json.results as unknown[]) ||
    (json.data as unknown[]) ||
    (json.listings as unknown[]) ||
    (json.items as unknown[]) ||
    [];

  return candidates
    .map((item): RawListing | null => {
      if (typeof item !== "object" || item === null) return null;
      const obj = item as Record<string, unknown>;

      // Price: look for common field names
      const rawPrice =
        obj.price ??
        obj.Price ??
        (obj.extra as Record<string, unknown>)?.price;
      const price = Number(rawPrice);
      if (!price || isNaN(price)) return null;

      // Year
      const rawYear =
        obj.year ??
        obj.Year ??
        (obj.details as Record<string, unknown>)?.year ??
        (obj.extra as Record<string, unknown>)?.year;
      const year = Number(rawYear);
      if (!year || isNaN(year)) return null;

      // Mileage
      const rawMileage =
        obj.mileage ??
        obj.Mileage ??
        (obj.details as Record<string, unknown>)?.mileage ??
        (obj.extra as Record<string, unknown>)?.kilometers;
      const mileage = rawMileage != null ? Number(rawMileage) : null;

      // Trim
      const trim =
        (obj.trim as string) ??
        (obj.variant as string) ??
        ((obj.details as Record<string, unknown>)?.trim as string) ??
        null;

      // Condition
      const condition =
        (obj.condition as string) ??
        ((obj.details as Record<string, unknown>)?.condition as string) ??
        null;

      const url = (obj.url as string) ?? (obj.link as string) ?? undefined;

      return {
        make,
        model,
        year,
        trim: trim || null,
        mileage: mileage !== null && !isNaN(mileage) ? mileage : null,
        price,
        condition: condition || null,
        url,
      };
    })
    .filter((l): l is RawListing => l !== null);
}

async function scrapeModelYear(
  page: Page,
  make: string,
  dubizzleMake: string,
  model: string,
  dubizzleModel: string,
  collectedListings: RawListing[]
): Promise<void> {
  const key = `${make}/${model}`;
  console.log(`  Scraping ${key}...`);

  let pageNum = 1;
  let hasMore = true;

  while (hasMore && pageNum <= SCRAPE_CONFIG.maxPagesPerSearch) {
    const url = `${SCRAPE_CONFIG.baseUrl}?make=${dubizzleMake}&model=${dubizzleModel}&page=${pageNum}`;

    const intercepted: RawListing[] = [];

    // Set up response interceptor for this navigation
    const onResponse = async (response: Response) => {
      if (!response.url().includes(API_URL_PATTERN)) return;
      if (!response.url().includes("motor") && !response.url().includes("listing") && !response.url().includes("api")) return;

      try {
        const contentType = response.headers()["content-type"] ?? "";
        if (!contentType.includes("json")) return;
        const json = await response.json();
        const listings = extractListingsFromJson(json, make, model);
        intercepted.push(...listings);
      } catch {
        // Not JSON or failed to parse — skip
      }
    };

    page.on("response", onResponse);

    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await sleep(1000); // let async API calls settle
    } catch (err) {
      console.warn(`    Timeout on page ${pageNum} of ${key}, continuing`);
    }

    page.off("response", onResponse);

    if (intercepted.length === 0) {
      // Fall back to DOM scraping if API interception didn't fire
      const domListings = await page.evaluate(
        ([makeStr, modelStr]: [string, string]) => {
          const cards = document.querySelectorAll("[class*='listing'], [class*='card'], article");
          const results: Array<{ make: string; model: string; year: number; price: number; mileage: number | null; trim: string | null; condition: string | null }> = [];
          cards.forEach((card) => {
            const text = card.textContent ?? "";
            const priceMatch = text.match(/AED\s*([\d,]+)/i);
            const yearMatch = text.match(/\b(20\d{2}|19\d{2})\b/);
            const mileageMatch = text.match(/([\d,]+)\s*km/i);
            if (!priceMatch || !yearMatch) return;
            const price = parseInt(priceMatch[1].replace(/,/g, ""));
            const year = parseInt(yearMatch[1]);
            const mileage = mileageMatch ? parseInt(mileageMatch[1].replace(/,/g, "")) : null;
            if (price > 0 && year > 1990) {
              results.push({ make: makeStr, model: modelStr, year, price, mileage, trim: null, condition: null });
            }
          });
          return results;
        },
        [make, model] as [string, string]
      );

      if (domListings.length > 0) {
        intercepted.push(...(domListings as RawListing[]));
        console.log(`    Page ${pageNum}: ${domListings.length} listings (DOM fallback)`);
      } else {
        console.log(`    Page ${pageNum}: no listings found, stopping`);
        hasMore = false;
        break;
      }
    } else {
      console.log(`    Page ${pageNum}: ${intercepted.length} listings (API)`);
    }

    collectedListings.push(...intercepted);

    if (intercepted.length < 20) {
      hasMore = false; // last page likely
    }

    pageNum++;
    await sleep(SCRAPE_CONFIG.requestDelayMs);
  }
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const allListings: RawListing[] = [];
  const report: ScrapeReport = {
    startedAt: new Date().toISOString(),
    finishedAt: "",
    totalCollected: 0,
    byMakeModel: {},
  };

  const browser = await chromium.launch({ headless: true, slowMo: 50 });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  try {
    for (const target of SCRAPE_TARGETS) {
      const page = await context.newPage();
      for (const modelConfig of target.models) {
        const key = `${target.make}/${modelConfig.name}`;
        const before = allListings.length;
        try {
          await scrapeModelYear(
            page,
            target.make,
            target.dubizzleMake,
            modelConfig.name,
            modelConfig.dubizzleModel,
            allListings
          );
          report.byMakeModel[key] = { collected: allListings.length - before };
        } catch (err) {
          console.error(`  Error scraping ${key}:`, err);
          report.byMakeModel[key] = {
            collected: allListings.length - before,
            error: String(err),
          };
        }
        await sleep(500);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }

  report.finishedAt = new Date().toISOString();
  report.totalCollected = allListings.length;

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "rawListings.json"),
    JSON.stringify(allListings, null, 2)
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "scrapeReport.json"),
    JSON.stringify(report, null, 2)
  );

  console.log(`\nDone. Collected ${allListings.length} listings.`);
  console.log(`Report: scripts/output/scrapeReport.json`);
  console.log(`Raw data: scripts/output/rawListings.json`);
  console.log(`\nNext step: npx tsx scripts/processData.ts`);
}

main().catch(console.error);
