// apps/web/src/lib/exports/filename.ts

/**
 * Converts a string to a URL-safe slug.
 * - Lowercases
 * - Strips diacritics (á → a, ñ → n)
 * - Replaces non-alphanumeric characters with dashes
 * - Collapses consecutive dashes
 * - Trims leading/trailing dashes
 * - Truncates at 60 characters
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')                     // decompose combined characters
    .replace(/[\u0300-\u036f]/g, '')      // remove diacritic marks
    .replace(/[^a-z0-9]+/g, '-')          // non-alphanum to single dash
    .replace(/^-+|-+$/g, '')              // trim leading/trailing dashes
    .slice(0, 60);
}

/**
 * Builds the filename for an exported report.
 *
 * Format: splash-{slug}-{from}-{to}.{ext}
 * Example: splash-splash-verify-station-2026-03-11-2026-04-09.xlsx
 *
 * If carWashName is empty or becomes empty after slugifying, the slug segment
 * is omitted and the result is splash-{from}-{to}.{ext}.
 */
export function buildExportFilename(
  carWashName: string,
  fromDate: string,
  toDate: string,
  ext: 'xlsx' | 'pdf'
): string {
  const slug = slugify(carWashName);
  const parts = ['splash'];
  if (slug) parts.push(slug);
  parts.push(fromDate);
  parts.push(toDate);
  return `${parts.join('-')}.${ext}`;
}
