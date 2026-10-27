import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merges conditional class names and resolves Tailwind conflicts (shadcn-style helper). */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Formats an ISO date string as a short, readable date (e.g. "Jul 24, 2026"). */
export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Formats an ISO date-time string as a short readable date + time. */
export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Formats a number as currency. Defaults to USD; pass the company's configured currency if available. */
export function formatCurrency(value, currency = 'USD') {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
}

/** Formats a plain number with thousands separators. */
export function formatNumber(value, decimals = 0) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount);
}

/** Converts snake_case or camelCase strings into readable Title Case labels. */
export function toTitleCase(value) {
  if (!value) return '';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Builds a query string from a plain object, skipping empty/undefined values. */
export function buildQueryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  });
  const str = search.toString();
  return str ? `?${str}` : '';
}
