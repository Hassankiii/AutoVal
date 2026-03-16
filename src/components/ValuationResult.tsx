"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DepreciationChart } from "@/components/DepreciationChart";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { FallbackWarning } from "@/components/FallbackWarning";
import { buildDepreciationSeries } from "@/lib/chartDataBuilder";
import { formatAED } from "@/lib/utils";
import type { ValuationInput, ValuationResult as ValuationResultType } from "@/types/valuation";

interface ValuationResultProps {
  input: ValuationInput;
  result: ValuationResultType;
}

export function ValuationResult({ input, result }: ValuationResultProps) {
  const currentYear = new Date().getFullYear();

  const chartData = useMemo(
    () => buildDepreciationSeries(input.make, input.model, input, result),
    [input, result]
  );

  const mileageSign = result.mileageAdjustment >= 0 ? "+" : "";
  const mileagePct = `${mileageSign}${(result.mileageAdjustment * 100).toFixed(1)}%`;
  const mileageColor =
    result.mileageAdjustment >= 0 ? "text-emerald-400" : "text-red-400";

  const conditionPct = `${((result.conditionMultiplier - 1) * 100).toFixed(0)}%`;
  const conditionColor =
    result.conditionMultiplier >= 1 ? "text-emerald-400" : "text-amber-400";

  return (
    <div className="space-y-4">
      {/* Hero value card */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6 pb-5">
          <div className="space-y-1 mb-4">
            <p className="text-slate-400 text-sm">
              {input.year} {input.make} {input.model}
              {input.trim ? ` · ${input.trim}` : ""}
            </p>
            <p className="text-5xl font-bold text-emerald-400 tabular-nums">
              {formatAED(result.estimatedValue)}
            </p>
            <p className="text-slate-500 text-sm">
              Market range:{" "}
              <span className="text-slate-400">
                {formatAED(result.p25)} – {formatAED(result.p75)}
              </span>
            </p>
          </div>

          <ConfidenceBadge
            confidence={result.confidence}
            sampleSize={result.sampleSize}
          />

          {result.fallbackTier > 0 && (
            <div className="mt-3">
              <FallbackWarning
                tier={result.fallbackTier}
                reason={result.fallbackReason}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjustments breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-500 mb-1">Base (market)</p>
            <p className="text-slate-200 font-semibold text-sm tabular-nums">
              {formatAED(result.basePrice)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-500 mb-1">Mileage</p>
            <p className={`font-semibold text-sm tabular-nums ${mileageColor}`}>
              {mileagePct}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-500 mb-1">Condition</p>
            <p className={`font-semibold text-sm ${conditionColor}`}>
              {input.condition.charAt(0).toUpperCase() + input.condition.slice(1)}{" "}
              <span className="text-xs opacity-70">({conditionPct})</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Depreciation chart */}
      {chartData.length > 1 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2 pt-4">
            <p className="text-slate-300 text-sm font-medium">
              {input.make} {input.model} — Market value by year
            </p>
            <p className="text-slate-500 text-xs">
              Real Dubizzle UAE listings · Amber dot = your car
            </p>
          </CardHeader>
          <CardContent className="pb-4">
            <DepreciationChart
              data={chartData}
              currentYear={currentYear}
              userYear={input.year}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
