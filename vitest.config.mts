/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/__test__/**/*.{test,spec}.{ts,tsx}', '**/__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/e2e/**', '**/node_modules/**'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      'until-async': path.resolve(__dirname, './__mocks__/until-async.js'),
    },
    // Prevent ESM issues by forcing problematic packages to be inlined or handled correctly
    server: {
      deps: {
        inline: [/@exodus\/bytes/, /html-encoding-sniffer/],
      }
    }
  },
});
