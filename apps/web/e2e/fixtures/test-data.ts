const ts = process.env.TEST_RUN_TS || String(Date.now());

export const TEST_ADMIN = {
  nombre: `Admin Test ${ts}`,
  email: `test-admin-${ts}@splash.test`,
  password: 'TestPass123!',
  nombreNegocio: `AutoSpa Test ${ts}`,
  direccion: 'Av. Reforma 100, CDMX',
};

export const TEST_CLIENT = {
  nombre: `Cliente Test ${ts}`,
  email: `test-client-${ts}@splash.test`,
  password: 'TestPass123!',
};

export const AUTH_DIR = './e2e/.auth';
export const ADMIN_STATE = `${AUTH_DIR}/wash-admin.json`;
export const CLIENT_STATE = `${AUTH_DIR}/client.json`;
export const SHARED_DATA_PATH = `${AUTH_DIR}/shared-data.json`;

import { readFileSync, writeFileSync } from 'fs';

export function saveSharedData(data: Record<string, string>) {
  writeFileSync(SHARED_DATA_PATH, JSON.stringify(data, null, 2));
}

export function loadSharedData(): Record<string, string> {
  try {
    return JSON.parse(readFileSync(SHARED_DATA_PATH, 'utf-8'));
  } catch {
    return {};
  }
}
