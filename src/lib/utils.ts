import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAED(value: number): string {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatAEDCompact(value: number): string {
  if (value >= 1_000_000) {
    return `AED ${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `AED ${Math.round(value / 1000)}K`;
  }
  return formatAED(value);
}
