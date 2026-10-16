/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const API_TARGET = 'https://tdd.demo.reaktivate.com';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // The API uses a self-signed certificate; proxying through the dev server
    // means the browser never has to accept it manually.
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/Test/setup.ts'],
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/Test/**', 'src/index.tsx', 'src/bootstrap.ts'],
      reporter: ['text', 'html', 'lcov'],
      // Logic lives in controllers and repositories, so they get stricter thresholds than the rest.
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
        'src/**/*.controller.ts': { statements: 100, branches: 95, functions: 100, lines: 100 },
        'src/**/*.repository.ts': { statements: 95, branches: 85, functions: 100, lines: 100 },
      },
    },
  },
});
