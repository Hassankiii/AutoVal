import type { ConfidenceLevel } from "@/types/valuation";

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  sampleSize: number;
}

export function ConfidenceBadge({ confidence, sampleSize }: ConfidenceBadgeProps) {
  const config = {
    high: { label: "High confidence", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    medium: { label: "Medium confidence", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    low: { label: "Low confidence", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  }[confidence];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          confidence === "high"
            ? "bg-emerald-400"
            : confidence === "medium"
            ? "bg-amber-400"
            : "bg-red-400"
        }`}
      />
      {config.label}
      {sampleSize > 0 && (
        <span className="opacity-70">· {sampleSize} listings</span>
      )}
    </span>
  );
}
