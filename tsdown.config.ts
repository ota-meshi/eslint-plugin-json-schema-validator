import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: './src/index.ts',
    worker: './src/utils/http-client/worker.ts',
  },
  format: ['cjs'],
  platform: 'node',
  dts: {
    only: ['./src/index.ts'],
  },
  clean: true,
  outDir: 'lib',
  treeshake: {
    moduleSideEffects: false,
  },
  // Set to false because tsdown warns about using CJS format,
  // but ESLint plugins require CommonJS for compatibility
  failOnWarn: false,
  outputOptions: {
    entryFileNames: '[name].js',
    chunkFileNames: '[name]-[hash].js',
    minify: false,
  },
})
