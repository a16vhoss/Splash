// apps/web/src/lib/analytics-colors.ts

/**
 * Fixed palette for service colors in stacked charts.
 * Colors are drawn from the Tailwind config tokens to stay consistent
 * with the rest of the app's visual identity.
 */
const SERVICE_PALETTE = [
  '#059669', // accent (emerald 600)
  '#0284C7', // primary (sky 600)
  '#F59E0B', // warning (amber 500)
  '#8B5CF6', // violet 500
  '#EC4899', // pink 500
  '#14B8A6', // teal 500
  '#F97316', // orange 500
  '#6366F1', // indigo 500
] as const;

/**
 * Deterministic color assignment. Sorts service names alphabetically
 * and assigns palette colors by index so the same service always
 * gets the same color across renders.
 */
export function assignServiceColors(serviceNames: string[]): Record<string, string> {
  const uniqueNames = Array.from(new Set(serviceNames));
  const sorted = uniqueNames.sort((a, b) => a.localeCompare(b, 'es'));
  const result: Record<string, string> = {};
  for (let i = 0; i < sorted.length; i++) {
    result[sorted[i]] = SERVICE_PALETTE[i % SERVICE_PALETTE.length];
  }
  return result;
}

export { SERVICE_PALETTE };
