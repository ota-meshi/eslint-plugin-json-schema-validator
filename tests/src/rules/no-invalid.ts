import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { RuleTester } from "eslint";
import rule from "../../../src/rules/no-invalid.ts";
import { loadTestCases } from "../../utils/utils.ts";
import * as jsonParser from "jsonc-eslint-parser";
import * as tomlParser from "toml-eslint-parser";
// @ts-expect-error -- missing types
import * as espree from "espree";

const tester = new RuleTester({
  languageOptions: {
    /* eslint @typescript-eslint/no-require-imports: 0 -- ignore */
    parser: jsonParser,
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

tester.run(
  "no-invalid",
  rule as any,
  loadTestCases(
    "no-invalid",
    {},
    {
      valid: [
        {
          filename: path.join(
            dirname(fileURLToPath(import.meta.url)),
            ".eslintrc.js",
          ),
          code: 'module.exports = { "extends": [ require.resolve("eslint-config-foo") ] }',
          languageOptions: {
            parser: espree,
          },
          options: [
            {
              schemas: [
                {
                  fileMatch: ["tests/src/rules/.eslintrc.js"],
                  schema: "https://www.schemastore.org/eslintrc",
                },
              ],
              useSchemastoreCatalog: false,
            },
          ],
        },
      ],
      invalid: [
        {
          filename: ".eslintrc.json",
          code: '{ "extends": [ 42 ] }',
          errors: [
            '"extends" must be string.',
            '"extends" must match exactly one schema in oneOf.',
            '"extends[0]" must be string.',
          ],
        },
        {
          filename: ".eslintrc.json",
          code: '{ "extends": [ 42 ] }',
          options: [
            {
              schemas: [
                {
                  fileMatch: [".eslintrc.*"],
                  schema: "https://www.schemastore.org/eslintrc",
                },
              ],
            },
          ],
          errors: [
            '"extends" must be string.',
            '"extends" must match exactly one schema in oneOf.',
            '"extends[0]" must be string.',
          ],
        },
        {
          filename: path.join(
            dirname(fileURLToPath(import.meta.url)),
            ".eslintrc.js",
          ),
          code: 'module.exports = { "extends": [ 42 ] }',
          languageOptions: {
            parser: espree,
          },
          options: [
            {
              schemas: [
                {
                  fileMatch: ["tests/src/rules/.eslintrc.js"],
                  schema: "https://www.schemastore.org/eslintrc",
                },
              ],
              useSchemastoreCatalog: false,
            },
          ],
          errors: [
            '"extends" must be string.',
            '"extends" must match exactly one schema in oneOf.',
            '"extends[0]" must be string.',
          ],
        },
        {
          filename: path.join(
            dirname(fileURLToPath(import.meta.url)),
            ".eslintrc.json",
          ),
          code: '{ "extends": [ 98 ], "$schema": "https://www.schemastore.org/eslintrc" }',
          options: [
            {
              schemas: [
                {
                  fileMatch: ["tests/src/rules/.eslintrc.json"],
                  schema: {
                    properties: {
                      foo: {
                        type: "number",
                      },
                    },
                    required: ["foo"],
                  },
                },
              ],
              mergeSchemas: true,
              useSchemastoreCatalog: false,
            },
          ],
          errors: [
            "Root must have required property 'foo'.",
            '"extends" must be string.',
            '"extends" must match exactly one schema in oneOf.',
            '"extends[0]" must be string.',
          ],
        },
        {
          filename: path.join(
            dirname(fileURLToPath(import.meta.url)),
            "version.json",
          ),
          code: '{ "extends": [ 99 ], "$schema": "https://www.schemastore.org/eslintrc" }',
          options: [
            {
              schemas: [
                {
                  fileMatch: ["tests/src/rules/version.json"],
                  schema: {
                    properties: {
                      foo: {
                        type: "number",
                      },
                    },
                    required: ["foo"],
                  },
                },
              ],
              mergeSchemas: true,
              useSchemastoreCatalog: true,
            },
          ],
          errors: [
            "Root must have required property 'foo'.",
            "Root must have required property 'version'.",
            "Root must have required property 'inherit'.",
            "Root must match a schema in anyOf.",
            '"extends" must be string.',
            '"extends" must match exactly one schema in oneOf.',
            '"extends[0]" must be string.',
          ],
        },
        {
          filename: path.join(
            dirname(fileURLToPath(import.meta.url)),
            "version.json",
          ),
          code: '{ "extends": [ 100 ], "$schema": "https://www.schemastore.org/eslintrc" }',
          options: [
            {
              schemas: [
                {
                  fileMatch: ["tests/src/rules/version.json"],
                  schema: {
                    properties: {
                      foo: {
                        type: "number",
                      },
                    },
                    required: ["foo"],
                  },
                },
              ],
              mergeSchemas: ["catalog", "options"],
              useSchemastoreCatalog: true,
            },
          ],
          errors: [
            "Root must have required property 'foo'.",
            "Root must have required property 'version'.",
            "Root must have required property 'inherit'.",
            "Root must match a schema in anyOf.",
          ],
        },
        {
          filename: path.join(
            dirname(fileURLToPath(import.meta.url)),
            "version.json",
          ),
          code: '{ "extends": [ 101 ], "$schema": "https://www.schemastore.org/eslintrc" }',
          options: [
            {
              schemas: [
                {
                  fileMatch: ["tests/src/rules/version.json"],
                  schema: {
                    properties: {
                      foo: {
                        type: "number",
                      },
                    },
                    required: ["foo"],
                  },
                },
              ],
              mergeSchemas: ["$schema", "options"],
              useSchemastoreCatalog: true,
            },
          ],
          errors: [
            "Root must have required property 'foo'.",
            '"extends" must be string.',
            '"extends" must match exactly one schema in oneOf.',
            '"extends[0]" must be string.',
          ],
        },
        {
          filename: path.join(
            dirname(fileURLToPath(import.meta.url)),
            "version.json",
          ),
          code: '{ "extends": [ 102 ], "$schema": "https://www.schemastore.org/eslintrc" }',
          options: [
            {
              schemas: [
                {
                  fileMatch: ["tests/src/rules/version.json"],
                  schema: {
                    properties: {
                      foo: {
                        type: "number",
                      },
                    },
                    required: ["foo"],
                  },
                },
              ],
              mergeSchemas: ["$schema", "catalog"],
              useSchemastoreCatalog: false,
            },
          ],
          errors: [
            '"extends" must be string.',
            '"extends" must match exactly one schema in oneOf.',
            '"extends[0]" must be string.',
          ],
        },
        {
          filename: path.join(
            dirname(fileURLToPath(import.meta.url)),
            "version.json",
          ),
          code: '{ "extends": [ 103 ], "$schema": "https://www.schemastore.org/eslintrc" }',
          options: [
            {
              schemas: [
                {
                  fileMatch: ["tests/src/rules/version.json"],
                  schema: {
                    properties: {
                      foo: {
                        type: "number",
                      },
                    },
                    required: ["foo"],
                  },
                },
              ],
              mergeSchemas: ["options", "catalog"],
              useSchemastoreCatalog: false,
            },
          ],
          errors: ["Root must have required property 'foo'."],
        },
        {
          filename: path.join(
            dirname(fileURLToPath(import.meta.url)),
            "version.json",
          ),
          code: '{ "extends": [ 104 ], "$schema": "https://www.schemastore.org/eslintrc" }',
          options: [
            {
              mergeSchemas: ["options", "catalog"],
              useSchemastoreCatalog: false,
            },
          ],
          errors: [
            '"extends" must be string.',
            '"extends" must match exactly one schema in oneOf.',
            '"extends[0]" must be string.',
          ],
        },
        {
          filename: path.join(
            dirname(fileURLToPath(import.meta.url)),
            ".prettierrc.toml",
          ),
          code: `
trailingComma = "es3"
tabWidth = 4
semi = false
singleQuote = true`,
          languageOptions: {
            parser: tomlParser,
          },
          options: [
            {
              schemas: [
                {
                  fileMatch: [".prettierrc.toml"],
                  schema: "https://www.schemastore.org/prettierrc",
                },
              ],
              useSchemastoreCatalog: false,
            },
          ],
          errors: [
            '"trailingComma" must be equal to "all".',
            '"trailingComma" must be equal to "es5".',
            '"trailingComma" must be equal to "none".',
            '"trailingComma" must match exactly one schema in oneOf.',
            "Root must be string.",
            "Root must match exactly one schema in oneOf.",
          ],
        },
        // mostSpecificErrorsOnly: OFF (default) — cascade preserved
        {
          filename: "reduce-off.json",
          code: '{ "extends": [ 42 ] }',
          options: [
            {
              schemas: [
                {
                  fileMatch: ["reduce-off.json"],
                  schema: {
                    type: "object",
                    properties: {
                      extends: {
                        oneOf: [
                          { type: "string" },
                          { type: "array", items: { type: "string" } },
                        ],
                      },
                    },
                  },
                },
              ],
              useSchemastoreCatalog: false,
            },
          ],
          errors: [
            '"extends" must be string.',
            '"extends" must match exactly one schema in oneOf.',
            '"extends[0]" must be string.',
          ],
        },
        // mostSpecificErrorsOnly: ON — best-branch + reworded umbrella
        {
          filename: "reduce-on.json",
          code: '{ "extends": [ 42 ] }',
          options: [
            {
              schemas: [
                {
                  fileMatch: ["reduce-on.json"],
                  schema: {
                    type: "object",
                    properties: {
                      extends: {
                        oneOf: [
                          { type: "string" },
                          { type: "array", items: { type: "string" } },
                        ],
                      },
                    },
                  },
                },
              ],
              useSchemastoreCatalog: false,
              mostSpecificErrorsOnly: true,
            },
          ],
          errors: [
            '"extends" must match one of the allowed schemas.',
            '"extends[0]" must be string.',
          ],
        },
        // mostSpecificErrorsOnly: ON — identical branches collapse to one error
        {
          filename: "reduce-identical.json",
          code: '"hello"',
          options: [
            {
              schemas: [
                {
                  fileMatch: ["reduce-identical.json"],
                  schema: {
                    oneOf: [
                      { type: "object", properties: { a: { type: "number" } } },
                      { type: "object", properties: { b: { type: "number" } } },
                    ],
                  },
                },
              ],
              useSchemastoreCatalog: false,
              mostSpecificErrorsOnly: true,
            },
          ],
          errors: ["Root must be object."],
        },
        // mostSpecificErrorsOnly: ON — anyOf end-to-end: umbrella + best branch
        {
          filename: "reduce-anyof.json",
          code: '{ "val": true }',
          options: [
            {
              schemas: [
                {
                  fileMatch: ["reduce-anyof.json"],
                  schema: {
                    type: "object",
                    properties: {
                      val: {
                        anyOf: [{ type: "string" }, { type: "number" }],
                      },
                    },
                  },
                },
              ],
              useSchemastoreCatalog: false,
              mostSpecificErrorsOnly: true,
            },
          ],
          errors: [
            '"val" must match one of the allowed schemas.',
            '"val" must be string.',
          ],
        },
        // mostSpecificErrorsOnly: ON — partial overlap (the issue's typo scenario):
        // both branches agree `runn` is unexpected but each requires a different
        // property, so the umbrella + best (lowest-index) branch are reported.
        {
          filename: "reduce-typo.json",
          code: '{ "name": "t", "runn": "echo" }',
          options: [
            {
              schemas: [
                {
                  fileMatch: ["reduce-typo.json"],
                  schema: {
                    type: "object",
                    oneOf: [
                      {
                        required: ["run"],
                        properties: { run: {}, name: {} },
                        additionalProperties: false,
                      },
                      {
                        required: ["uses"],
                        properties: { uses: {}, name: {} },
                        additionalProperties: false,
                      },
                    ],
                  },
                },
              ],
              useSchemastoreCatalog: false,
              mostSpecificErrorsOnly: true,
            },
          ],
          errors: [
            "Root must match one of the allowed schemas.",
            "Root must have required property 'run'.",
            'Unexpected property "runn"',
          ],
        },
      ],
    },
  ),
);
