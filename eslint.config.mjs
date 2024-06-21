import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      ".cached_schemastore/",
      ".nyc_output/",
      "coverage/",
      "dist/",
      "!docs/.vitepress/",
      "docs/.vitepress/dist/",
      "docs/.vitepress/cache/",
      "docs/.vitepress/build-system/shim/",
      "lib/",
      "node_modules/",
      "schemastore/",
      "tests/fixtures/integrations/",
      "assets/",
      "!.github/",
      "!.vscode/",
      "**/*.md/*.bash",
    ],
  },
  ...compat.extends(
    "plugin:@ota-meshi/recommended",
    "plugin:@ota-meshi/+node",
    "plugin:@ota-meshi/+typescript",
    "plugin:@ota-meshi/+eslint-plugin",
    "plugin:@ota-meshi/+vue3",
    "plugin:@ota-meshi/+package-json",
    "plugin:@ota-meshi/+json",
    "plugin:@ota-meshi/+yaml",
    "plugin:@ota-meshi/+toml",
    "plugin:@ota-meshi/+md",
    "plugin:@ota-meshi/+prettier",
  ),
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",

      parserOptions: {
        project: true,
      },
    },

    rules: {
      "one-var": "off",
      "no-warning-comments": "warn",
      "no-lonely-if": "off",
      "new-cap": "off",
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": "off",

      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["/regexpp", "/regexpp/*"],
              message: "Please use `@eslint-community/regexpp` instead.",
            },
            {
              group: ["/eslint-utils", "/eslint-utils/*"],
              message: "Please use `@eslint-community/eslint-utils` instead.",
            },
          ],
        },
      ],

      "no-restricted-properties": [
        "error",
        {
          object: "context",
          property: "getSourceCode",
          message:
            "Please use `eslint-compat-utils` module's `getSourceCode(context).getScope()` instead.",
        },
        {
          object: "context",
          property: "sourceCode",
          message:
            "Please use `eslint-compat-utils` module's `getSourceCode(context).getScope()` instead.",
        },
        {
          object: "context",
          property: "getFilename",
          message:
            "Please use `eslint-compat-utils` module's `getFilename(context)` instead.",
        },
        {
          object: "context",
          property: "filename",
          message:
            "Please use `eslint-compat-utils` module's `getFilename(context)` instead.",
        },
        {
          object: "context",
          property: "getCwd",
          message:
            "Please use `eslint-compat-utils` module's `getCwd(context)` instead.",
        },
        {
          object: "context",
          property: "cwd",
          message:
            "Please use `eslint-compat-utils` module's `getCwd(context)` instead.",
        },
        {
          object: "context",
          property: "getScope",
          message:
            "Please use `eslint-compat-utils` module's `getSourceCode(context).getScope()` instead.",
        },
        {
          object: "context",
          property: "parserServices",
          message:
            "Please use `eslint-compat-utils` module's `getSourceCode(context).parserServices` instead.",
        },
      ],
    },
  },
  {
    files: ["**/*.ts", "**/*.mts"],

    languageOptions: {
      parser: tsParser,
      sourceType: "module",

      parserOptions: {
        project: true,
      },
    },

    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "default",
          format: ["camelCase"],
          leadingUnderscore: "allow",
          trailingUnderscore: "allow",
        },
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
          trailingUnderscore: "allow",
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
        {
          selector: "property",
          format: null,
        },
        {
          selector: "method",
          format: null,
        },
        {
          selector: "import",
          format: null,
        },
      ],

      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  {
    files: ["tests/fixtures/**"],

    rules: {
      "json-schema-validator/no-invalid": "off",
    },
  },
  {
    files: ["scripts/**/*.ts", "tests/**/*.ts"],

    languageOptions: {
      parser: tsParser,
      sourceType: "module",

      parserOptions: {
        project: true,
      },
    },

    rules: {
      "jsdoc/require-jsdoc": "off",
      "no-console": "off",
      "@typescript-eslint/no-misused-promises": "off",
    },
  },
  {
    files: ["**/*.vue"],

    languageOptions: {
      globals: {
        require: true,
      },
      sourceType: "module",
    },
  },
  ...compat
    .extends("plugin:@typescript-eslint/disable-type-checked")
    .map((config) => ({
      ...config,
      files: ["docs/.vitepress/**/*.", "docs/.vitepress/*."].flatMap((s) => [
        `${s}js`,
        `${s}mjs`,
        `${s}ts`,
        `${s}mts`,
        `${s}vue`,
      ]),
    })),
  {
    files: ["docs/.vitepress/**/*.", "docs/.vitepress/*."].flatMap((s) => [
      `${s}js`,
      `${s}mjs`,
      `${s}ts`,
      `${s}mts`,
      `${s}vue`,
    ]),

    languageOptions: {
      globals: {
        window: true,
      },
      sourceType: "module",
      parserOptions: {
        project: null,
      },
    },

    rules: {
      "jsdoc/require-jsdoc": "off",
      "eslint-plugin/require-meta-docs-description": "off",
      "eslint-plugin/require-meta-docs-url": "off",
      "eslint-plugin/require-meta-type": "off",
      "eslint-plugin/prefer-message-ids": "off",
      "eslint-plugin/prefer-object-rule": "off",
      "eslint-plugin/require-meta-schema": "off",
      "n/no-extraneous-import": "off",
      "n/file-extension-in-import": "off",
      "n/no-unsupported-features/node-builtins": "off",
    },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: {
      sourceType: "module",
    },
  },
  {
    files: ["*.md/*.js", "**/*.md/*.js"],
    languageOptions: {
      sourceType: "module",
    },
    rules: {
      "n/no-missing-import": "off",
    },
  },
  {
    files: ["**/*.toml"],
    rules: {
      "prettier/prettier": "off",
    },
  },
  {
    files: [
      "tests/fixtures/**/*.js",
      "tests/fixtures/**/*.yaml",
      "tests/fixtures/**/*.yml",
      "tests/fixtures/**/*.toml",
      "tests/fixtures/**/*.json5",
    ],
    languageOptions: {
      sourceType: "module",
    },
    rules: {
      "yml/no-empty-sequence-entry": "off",
      "toml/tables-order": "off",
      "yml/no-empty-document": "off",
      "yml/require-string-key": "off",
      "yml/no-empty-key": "off",
      "no-sparse-arrays": "off",
      "n/no-unsupported-features/es-syntax": "off",
      "no-implicit-coercion": "off",
      "n/no-exports-assign": "off",
      "n/exports-style": "off",
      "no-void": "off",
      eqeqeq: "off",
      "prefer-template": "off",
      yoda: "off",
      "jsdoc/require-jsdoc": "off",
      "jsonc/vue-custom-block/no-parsing-error": "off",
      "no-constant-binary-expression": "off",
      "prettier/prettier": "off",
      "jsonc/no-sparse-arrays": "off",
    },
  },
  {
    files: ["docs/.vitepress/shim/require-from-cache.mjs"],
    rules: {
      "n/no-missing-import": "off",
    },
  },
];
