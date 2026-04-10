// apps/web/src/lib/exports/trigger-download.ts

/**
 * Triggers a browser download for the given Blob with the given filename.
 * Uses the standard `<a download>` trick with `URL.createObjectURL`.
 *
 * Must be called in response to a user gesture (click handler) to avoid
 * browser pop-up blocking.
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
