import path from "path";
import { getRuleTester } from "eslint-compat-utils/rule-tester";
import rule from "../../../src/rules/no-invalid";
import { loadTestCases } from "../../utils/utils";
// eslint-disable-next-line @typescript-eslint/naming-convention -- class name
const RuleTester = getRuleTester();
const tester = new RuleTester({
  languageOptions: {
    /* eslint @typescript-eslint/no-require-imports: 0 -- ignore */
    parser: require("jsonc-eslint-parser"),
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
          filename: path.join(__dirname, ".eslintrc.js"),
          code: 'module.exports = { "extends": [ require.resolve("eslint-config-foo") ] }',
          languageOptions: {
            // eslint-disable-next-line n/no-extraneous-require -- test
            parser: require("espree"),
          },
          options: [
            {
              schemas: [
                {
                  fileMatch: ["tests/src/rules/.eslintrc.js"],
                  schema: "https://json.schemastore.org/eslintrc",
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
                  schema: "https://json.schemastore.org/eslintrc",
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
          filename: path.join(__dirname, ".eslintrc.js"),
          code: 'module.exports = { "extends": [ 42 ] }',
          languageOptions: {
            // eslint-disable-next-line n/no-extraneous-require -- test
            parser: require("espree"),
          },
          options: [
            {
              schemas: [
                {
                  fileMatch: ["tests/src/rules/.eslintrc.js"],
                  schema: "https://json.schemastore.org/eslintrc",
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
          filename: path.join(__dirname, ".eslintrc.json"),
          code: '{ "extends": [ 98 ], "$schema": "https://json.schemastore.org/eslintrc" }',
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
          filename: path.join(__dirname, "version.json"),
          code: '{ "extends": [ 99 ], "$schema": "https://json.schemastore.org/eslintrc" }',
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
          filename: path.join(__dirname, "version.json"),
          code: '{ "extends": [ 100 ], "$schema": "https://json.schemastore.org/eslintrc" }',
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
          filename: path.join(__dirname, "version.json"),
          code: '{ "extends": [ 101 ], "$schema": "https://json.schemastore.org/eslintrc" }',
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
          filename: path.join(__dirname, "version.json"),
          code: '{ "extends": [ 102 ], "$schema": "https://json.schemastore.org/eslintrc" }',
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
          filename: path.join(__dirname, "version.json"),
          code: '{ "extends": [ 103 ], "$schema": "https://json.schemastore.org/eslintrc" }',
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
          filename: path.join(__dirname, "version.json"),
          code: '{ "extends": [ 104 ], "$schema": "https://json.schemastore.org/eslintrc" }',
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
          filename: path.join(__dirname, ".prettierrc.toml"),
          code: `
trailingComma = "es3"
tabWidth = 4
semi = false
singleQuote = true`,
          languageOptions: {
            parser: require("toml-eslint-parser"),
          },
          options: [
            {
              schemas: [
                {
                  fileMatch: [".prettierrc.toml"],
                  schema: "https://json.schemastore.org/prettierrc",
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
      ],
    },
  ),
);
