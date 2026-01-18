import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "./src/index.ts",
    worker: "./src/utils/http-client/worker.ts",
    // For our site
    "utils/schema": "./src/utils/schema.ts",
  },
  format: ["esm", "cjs"],
  platform: "node",
  dts: true,
  clean: true,
  outDir: "lib",
  treeshake: {
    moduleSideEffects: false,
  },
  // Set to false because tsdown warns about using CJS format,
  // but ESLint plugins require CommonJS for compatibility
  failOnWarn: false,
});
