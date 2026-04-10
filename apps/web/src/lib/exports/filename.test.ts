// apps/web/src/lib/exports/filename.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, buildExportFilename } from './filename';

test('slugify lowercases and replaces spaces with dashes', () => {
  assert.equal(slugify('Splash Verify Station'), 'splash-verify-station');
});

test('slugify strips Spanish diacritics', () => {
  assert.equal(slugify('Autolavado Él Niño'), 'autolavado-el-nino');
});

test('slugify removes special characters', () => {
  assert.equal(slugify('Car Wash #1 (Premium)!'), 'car-wash-1-premium');
});

test('slugify trims leading and trailing dashes', () => {
  assert.equal(slugify('  Hello World  '), 'hello-world');
});

test('slugify collapses multiple dashes', () => {
  assert.equal(slugify('a---b___c'), 'a-b-c');
});

test('slugify truncates at 60 chars', () => {
  const longName = 'a'.repeat(100);
  assert.equal(slugify(longName).length, 60);
});

test('slugify returns empty string for empty input', () => {
  assert.equal(slugify(''), '');
});

test('slugify returns empty string for only special chars', () => {
  assert.equal(slugify('!!!'), '');
});

test('buildExportFilename combines slug, dates, and extension (xlsx)', () => {
  const result = buildExportFilename('Splash Verify Station', '2026-03-11', '2026-04-09', 'xlsx');
  assert.equal(result, 'splash-splash-verify-station-2026-03-11-2026-04-09.xlsx');
});

test('buildExportFilename combines slug, dates, and extension (pdf)', () => {
  const result = buildExportFilename('Splash Verify Station', '2026-03-11', '2026-04-09', 'pdf');
  assert.equal(result, 'splash-splash-verify-station-2026-03-11-2026-04-09.pdf');
});

test('buildExportFilename handles empty car wash name gracefully', () => {
  const result = buildExportFilename('', '2026-03-11', '2026-04-09', 'xlsx');
  // Empty slug collapses to just "splash-...-..." with no double dash
  assert.equal(result, 'splash-2026-03-11-2026-04-09.xlsx');
});
