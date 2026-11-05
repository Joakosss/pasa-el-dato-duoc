import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // BD compartida entre suites: evitar carreras (incluye WS + Mongo + PostgreSQL).
    fileParallelism: false,
    // Datos dev mínimos antes de correr las suites e2e (HU-UBI-01, T-15).
    globalSetup: ['./test/global-setup.e2e.ts'],
  },
});
