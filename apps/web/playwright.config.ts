import { defineConfig } from '@playwright/test';

process.env.TEST_RUN_TS = process.env.TEST_RUN_TS || String(Date.now());

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:3000',
    headless: false,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  reporter: [['html', { open: 'never' }], ['list']],
  projects: [
    {
      name: 'setup',
      testDir: './e2e',
      testMatch: 'global-setup.spec.ts',
    },
    {
      name: 'public',
      testDir: './e2e/public',
      dependencies: ['setup'],
    },
    {
      name: 'admin',
      testDir: './e2e/admin',
      dependencies: ['setup'],
      use: {
        storageState: './e2e/.auth/wash-admin.json',
      },
    },
    {
      name: 'client',
      testDir: './e2e/client',
      dependencies: ['admin'],
      use: {
        storageState: './e2e/.auth/client.json',
      },
    },
    {
      name: 'admin-round2',
      testDir: './e2e/admin-round2',
      dependencies: ['client'],
      use: {
        storageState: './e2e/.auth/wash-admin.json',
      },
    },
    {
      name: 'client-round2',
      testDir: './e2e/client-round2',
      dependencies: ['admin-round2'],
      use: {
        storageState: './e2e/.auth/client.json',
      },
    },
    {
      name: 'admin-round3',
      testDir: './e2e/admin-round3',
      dependencies: ['client-round2'],
      use: {
        storageState: './e2e/.auth/wash-admin.json',
      },
    },
    {
      name: 'client-relogin',
      testDir: './e2e/client-relogin',
      dependencies: ['admin-round3'],
      // No storageState — fresh browser for re-login
    },
    {
      name: 'client-round3',
      testDir: './e2e/client-round3',
      dependencies: ['client-relogin'],
      use: {
        storageState: './e2e/.auth/client.json',
      },
    },
  ],
});
