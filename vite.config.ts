import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { InlineConfig } from 'vitest/node'

// vitest ships its own `declare module 'vite' { interface UserConfig { test } }`
// augmentation, but it resolves against vitest's *own* nested vite copy — a
// different major version than this project's top-level `vite`. Declaring it here
// instead attaches `test` to the same `vite` module this file actually imports.
declare module 'vite' {
  interface UserConfig {
    test?: InlineConfig
  }
}

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  build: { outDir: 'dist', sourcemap: false },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
