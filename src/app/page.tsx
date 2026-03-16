"use client";

import { useMemo, useState, useCallback } from "react";
import { ValuationForm } from "@/components/ValuationForm";
import { ValuationResult } from "@/components/ValuationResult";
import { computeValuation } from "@/lib/valuationEngine";
import { getMetadata } from "@/lib/marketDataLoader";
import type { ValuationInput } from "@/types/valuation";

export default function Home() {
  const [input, setInput] = useState<ValuationInput | null>(null);
  const metadata = getMetadata();

  const result = useMemo(
    () => (input ? computeValuation(input) : null),
    [input]
  );

  const handleValuationChange = useCallback((newInput: ValuationInput) => {
    setInput(newInput);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              Auto<span className="text-emerald-400">Val</span>
            </h1>
            <p className="text-slate-500 text-xs">UAE Car Valuation</p>
          </div>
          {metadata.scrapedAt && (
            <p className="text-slate-600 text-xs hidden sm:block">
              Data:{" "}
              {new Date(metadata.scrapedAt).toLocaleDateString("en-AE", {
                month: "short",
                year: "numeric",
              })}{" "}
              · {metadata.totalListings.toLocaleString()} listings
            </p>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: form */}
          <div>
            <ValuationForm onValuationChange={handleValuationChange} />
          </div>

          {/* Right: result or empty state */}
          <div>
            {result && input ? (
              <ValuationResult input={input} result={result} />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-64 text-center px-8 py-16">
      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-slate-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <h2 className="text-slate-400 font-medium mb-2">Select your vehicle</h2>
      <p className="text-slate-600 text-sm max-w-xs">
        Choose a make, model, year, and condition to see your car&apos;s estimated
        market value based on real UAE listings.
      </p>
    </div>
  );
}
