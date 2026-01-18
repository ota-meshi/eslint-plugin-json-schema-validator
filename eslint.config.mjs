import tsParser from "@typescript-eslint/parser";
import myPlugin from "@ota-meshi/eslint-plugin";
import tseslint from "typescript-eslint";
import plugin from "./lib/index.mjs";

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
  ...myPlugin
    .config({
      node: true,
      ts: true,
      eslintPlugin: true,
      vue3: true,
      packageJson: true,
      json: true,
      yaml: true,
      toml: true,
      md: true,
      prettier: true,
    })
    .map((config) => {
      if (!config.plugins?.["json-schema-validator"]) {
        return config;
      }
      return {
        ...config,
        plugins: {
          ...config.plugins,
          "json-schema-validator": plugin,
        },
      };
    }),
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
      "no-return-await": "off",

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
  ...tseslint.config({
    files: ["tests/fixtures/**"],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      "json-schema-validator/no-invalid": "off",
      "jsonc/vue-custom-block/no-parsing-error": "off",
    },
  }),
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
  ...tseslint.config({
    files: ["docs/.vitepress/**/*.", "docs/.vitepress/*."].flatMap((s) => [
      `${s}js`,
      `${s}mjs`,
      `${s}ts`,
      `${s}mts`,
      `${s}vue`,
    ]),
    extends: [tseslint.configs.disableTypeChecked],
  }),
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
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: {
      sourceType: "module",
    },
  },
  ...tseslint.config({
    files: ["*.md/*.js", "**/*.md/*.js", "**/*.md/*.vue"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      sourceType: "module",
    },
    rules: {
      "n/no-missing-import": "off",
    },
  }),
  ...tseslint.config({
    files: ["**/*.md"],
    extends: [tseslint.configs.disableTypeChecked],
  }),
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
      globals: {
        exports: true,
        require: true,
        module: true,
      },
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
