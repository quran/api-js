import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['./test/**/*.test.{js,ts,jsx,tsx}'],
    setupFiles: ['./test/setup.ts'],
  },
});
