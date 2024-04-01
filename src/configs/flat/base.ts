import type { ESLint, Linter } from "eslint";
import * as jsoncParser from "jsonc-eslint-parser";
import * as yamlParser from "yaml-eslint-parser";
import * as tomlParser from "toml-eslint-parser";
export default [
  {
    plugins: {
      // eslint-disable-next-line @typescript-eslint/naming-convention -- plugin name
      get "json-schema-validator"(): ESLint.Plugin {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- ignore
        return require("../../index");
      },
    },
  },
  {
    files: [
      "*.json",
      "**/*.json",
      "*.json5",
      "**/*.json5",
      "*.jsonc",
      "**/*.jsonc",
    ],
    languageOptions: {
      parser: jsoncParser,
    },
    rules: {
      // ESLint core rules known to cause problems with JSON.
      strict: "off",
      "no-unused-expressions": "off",
      "no-unused-vars": "off",
    },
  },
  {
    files: ["*.yaml", "**/*.yaml", "*.yml", "**/*.yml"],
    languageOptions: {
      parser: yamlParser,
    },
    rules: {
      // ESLint core rules known to cause problems with YAML.
      "no-irregular-whitespace": "off",
      "no-unused-vars": "off",
      "spaced-comment": "off",
    },
  },
  {
    files: ["*.toml", "**/*.toml"],
    languageOptions: {
      parser: tomlParser,
    },
    rules: {
      // ESLint core rules known to cause problems with TOML.
      "no-irregular-whitespace": "off",
      "spaced-comment": "off",
    },
  },
] satisfies Linter.FlatConfig[] as Linter.FlatConfig[];
