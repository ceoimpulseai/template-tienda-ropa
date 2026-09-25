import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'api',
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: { NODE_ENV: 'test', TEST_AUTH_HEADER_ENABLED: 'true' },
  },
});
