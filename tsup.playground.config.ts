import { defineConfig } from 'tsup';

/** Browser-only bundle. Intentionally has no Node banner or server integration deps. */
export default defineConfig({
  entry: ['src/theme-playground.ts'],
  format: ['esm'],
  target: 'es2022',
  platform: 'browser',
  bundle: true,
  splitting: false,
  sourcemap: true,
  clean: false,
  dts: true,
});
