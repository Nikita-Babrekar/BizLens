import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a numeric value as Indian Rupee (₹) currency with 'en-IN' locale.
 */
export function formatCurrencyINR(
  amount: number | null | undefined,
  options?: Intl.NumberFormatOptions
): string {
  const val = amount ?? 0;
  return `₹${val.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  })}`;
}

/**
 * Format compact currency values (e.g., ₹45k, ₹1.2L)
 */
export function formatCompactINR(amount: number | null | undefined): string {
  const val = amount ?? 0;
  if (Math.abs(val) >= 10000000) {
    return `₹${(val / 10000000).toFixed(1)}Cr`;
  }
  if (Math.abs(val) >= 100000) {
    return `₹${(val / 100000).toFixed(1)}L`;
  }
  if (Math.abs(val) >= 1000) {
    return `₹${(val / 1000).toFixed(0)}k`;
  }
  return `₹${val}`;
}

