"use strict";

// const version = require("./package.json").version

module.exports = {
  parserOptions: {
    sourceType: "script",
    ecmaVersion: "latest",
    project: require.resolve("./tsconfig.json"),
  },
  extends: [
    "plugin:@ota-meshi/recommended",
    "plugin:@ota-meshi/+node",
    "plugin:@ota-meshi/+typescript",
    "plugin:@ota-meshi/+eslint-plugin",
    "plugin:@ota-meshi/+vue2",
    "plugin:@ota-meshi/+package-json",
    "plugin:@ota-meshi/+json",
    "plugin:@ota-meshi/+yaml",
    "plugin:@ota-meshi/+toml",
    "plugin:@ota-meshi/+md",
    "plugin:@ota-meshi/+prettier",
  ],
  rules: {
    "one-var": "off",
    "eslint-comments/no-unused-disable": "error",
    "require-jsdoc": "error",
    "no-warning-comments": "warn",
    "no-lonely-if": "off",
    "new-cap": "off",
    "no-shadow": "off",

    // Repo rule
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
  overrides: [
    {
      files: ["*.ts"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        sourceType: "module",
        project: require.resolve("./tsconfig.json"),
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
      parser: "@typescript-eslint/parser",
      parserOptions: {
        sourceType: "module",
        project: require.resolve("./tsconfig.json"),
      },
      rules: {
        "require-jsdoc": "off",
        "no-console": "off",
        "@typescript-eslint/no-misused-promises": "off",
      },
    },
    {
      files: ["*.vue"],
      parserOptions: {
        sourceType: "module",
      },
      globals: {
        require: true,
      },
    },
    {
      files: ["docs/.vuepress/**"],
      parserOptions: {
        sourceType: "module",
        ecmaVersion: 2020,
      },
      globals: {
        window: true,
      },
      rules: {
        "require-jsdoc": "off",
        "eslint-plugin/require-meta-docs-description": "off",
        "eslint-plugin/require-meta-docs-url": "off",
        "eslint-plugin/require-meta-type": "off",
        "eslint-plugin/prefer-message-ids": "off",
        "eslint-plugin/prefer-object-rule": "off",
        "eslint-plugin/require-meta-schema": "off",
      },
    },
    {
      files: ["*.mjs"],
      parserOptions: {
        sourceType: "module",
      },
    },
    {
      files: ["*.md/**", "**/*.md/**"],
      rules: {
        "n/no-missing-import": "off",
      },
    },
  ],
};
