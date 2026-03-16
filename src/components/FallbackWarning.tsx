import type { FallbackTier } from "@/types/valuation";

interface FallbackWarningProps {
  tier: FallbackTier;
  reason?: string;
}

export function FallbackWarning({ tier, reason }: FallbackWarningProps) {
  if (tier === 0) return null;

  const config = {
    1: {
      bg: "bg-slate-700/50 border-slate-600",
      icon: "ℹ",
      text: "text-slate-300",
      label: "Interpolated estimate",
    },
    2: {
      bg: "bg-amber-900/30 border-amber-700",
      icon: "⚠",
      text: "text-amber-300",
      label: "Limited market data",
    },
    3: {
      bg: "bg-orange-900/30 border-orange-700",
      icon: "⚠",
      text: "text-orange-300",
      label: "No market data available",
    },
  }[tier];

  if (!config) return null;

  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${config.bg}`}>
      <span className="mr-1.5">{config.icon}</span>
      <span className={`font-medium ${config.text}`}>{config.label}</span>
      {reason && (
        <span className="text-slate-400 ml-1">— {reason}</span>
      )}
    </div>
  );
}
