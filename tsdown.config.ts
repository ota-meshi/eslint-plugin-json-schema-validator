import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "./src/index.ts",
    worker: "./src/utils/http-client/worker.ts",
  },
  format: ["cjs"],
  platform: "node",
  dts: true,
  clean: true,
  outDir: "lib",
  treeshake: {
    moduleSideEffects: false,
  },
});
