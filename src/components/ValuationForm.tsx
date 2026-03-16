"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getAvailableMakes,
  getAvailableModels,
  getModelYears,
  getAvailableTrims,
  hasData,
} from "@/lib/marketDataLoader";
import type { ValuationInput, ConditionKey } from "@/types/valuation";
import { formatAED } from "@/lib/utils";

interface ValuationFormProps {
  onValuationChange: (input: ValuationInput) => void;
}

const CONDITIONS: { key: ConditionKey; label: string; description: string }[] =
  [
    { key: "excellent", label: "Excellent", description: "Like new, no issues" },
    { key: "good", label: "Good", description: "Minor wear, fully functional" },
    { key: "fair", label: "Fair", description: "Visible wear, some repairs needed" },
    { key: "poor", label: "Poor", description: "Major issues or damage" },
  ];

export function ValuationForm({ onValuationChange }: ValuationFormProps) {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [trim, setTrim] = useState("");
  const [mileage, setMileage] = useState(50000);
  const [condition, setCondition] = useState<ConditionKey>("good");

  const dataReady = hasData();
  const makes = dataReady ? getAvailableMakes() : [];
  const models = make ? getAvailableModels(make) : [];
  const years = make && model ? getModelYears(make, model) : [];
  const trims = make && model && year ? getAvailableTrims(make, model, year) : [];

  // Reset downstream on cascade change
  const handleMakeChange = (val: string | null) => {
    setMake(val ?? "");
    setModel("");
    setYear(null);
    setTrim("");
  };
  const handleModelChange = (val: string | null) => {
    setModel(val ?? "");
    setYear(null);
    setTrim("");
  };
  const handleYearChange = (val: string | null) => {
    setYear(val ? Number(val) : null);
    setTrim("");
  };

  // Fire valuation update whenever all required fields are set
  useEffect(() => {
    if (!make || !model || !year) return;
    onValuationChange({ make, model, year, trim, mileage, condition });
  }, [make, model, year, trim, mileage, condition, onValuationChange]);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-100 text-xl">Your Vehicle</CardTitle>
        {!dataReady && (
          <p className="text-amber-400 text-sm mt-1">
            ⚠ Market data not yet generated. Run{" "}
            <code className="bg-slate-900 px-1 rounded">
              npx tsx scripts/scrape.ts
            </code>{" "}
            then{" "}
            <code className="bg-slate-900 px-1 rounded">
              npx tsx scripts/processData.ts
            </code>{" "}
            to populate market data.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Make */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300">Make</label>
          <Select value={make} onValueChange={handleMakeChange}>
            <SelectTrigger className="bg-slate-900 border-slate-600 text-slate-100">
              <SelectValue placeholder="Select make" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-600">
              {makes.map((m) => (
                <SelectItem
                  key={m}
                  value={m}
                  className="text-slate-100 focus:bg-slate-700"
                >
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300">Model</label>
          <Select
            value={model}
            onValueChange={handleModelChange}
            disabled={!make}
          >
            <SelectTrigger className="bg-slate-900 border-slate-600 text-slate-100 disabled:opacity-40">
              <SelectValue placeholder={make ? "Select model" : "Select make first"} />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-600">
              {models.map((m) => (
                <SelectItem
                  key={m}
                  value={m}
                  className="text-slate-100 focus:bg-slate-700"
                >
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300">Year</label>
          <Select
            value={year ? String(year) : ""}
            onValueChange={handleYearChange}
            disabled={!model}
          >
            <SelectTrigger className="bg-slate-900 border-slate-600 text-slate-100 disabled:opacity-40">
              <SelectValue placeholder={model ? "Select year" : "Select model first"} />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-600">
              {years.map((y) => (
                <SelectItem
                  key={y}
                  value={String(y)}
                  className="text-slate-100 focus:bg-slate-700"
                >
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Trim (optional) */}
        {trims.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">
              Trim{" "}
              <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <Select value={trim} onValueChange={(val) => setTrim(val ?? "")}>
              <SelectTrigger className="bg-slate-900 border-slate-600 text-slate-100">
                <SelectValue placeholder="Any trim" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-600">
                <SelectItem value="" className="text-slate-100 focus:bg-slate-700">
                  Any trim
                </SelectItem>
                {trims.map((t) => (
                  <SelectItem
                    key={t}
                    value={t}
                    className="text-slate-100 focus:bg-slate-700"
                  >
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Mileage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">Mileage</label>
            <span className="text-emerald-400 font-semibold tabular-nums">
              {mileage.toLocaleString()} km
            </span>
          </div>
          <Slider
            value={[mileage]}
            onValueChange={(vals) => setMileage(Array.isArray(vals) ? vals[0] : vals as number)}
            min={0}
            max={300000}
            step={5000}
            className="[&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-emerald-400"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>0 km</span>
            <span>150,000 km</span>
            <span>300,000 km</span>
          </div>
        </div>

        {/* Condition */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Condition</label>
          <div className="grid grid-cols-2 gap-2">
            {CONDITIONS.map(({ key, label, description }) => (
              <Button
                key={key}
                variant="outline"
                onClick={() => setCondition(key)}
                className={`h-auto py-2.5 flex-col gap-0.5 border text-left items-start ${
                  condition === key
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                    : "bg-slate-900 border-slate-600 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span className="font-semibold text-sm">{label}</span>
                <span className="text-xs opacity-70 font-normal leading-tight">
                  {description}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
