import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "./src/index.ts",
    worker: "./src/utils/http-client/worker.ts",
  },
  format: ["esm"],
  platform: "node",
  dts: true,
  clean: true,
  outDir: "lib",
  fixedExtension: false,
  treeshake: {
    moduleSideEffects: false,
  },
});
