export = {
  plugins: ["json-schema-validator"],
  overrides: [
    {
      files: ["*.json", "*.json5", "*.jsonc"],
      parser: require.resolve("jsonc-eslint-parser"),
    },
    {
      files: ["*.yaml", "*.yml"],
      parser: require.resolve("yaml-eslint-parser"),
    },
    {
      files: ["*.toml"],
      parser: require.resolve("toml-eslint-parser"),
    },
  ],
};
