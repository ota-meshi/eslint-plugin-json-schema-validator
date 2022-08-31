import path from "path";
import { RuleTester } from "eslint";
import rule from "../../../src/rules/no-invalid";
import { loadTestCases } from "../../utils/utils";

const tester = new RuleTester({
  parser: require.resolve("jsonc-eslint-parser"),
  parserOptions: {
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
          parser: require.resolve("espree"),
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
          parser: require.resolve("espree"),
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
          filename: path.join(__dirname, ".prettierrc.toml"),
          code: `
trailingComma = "es3"
tabWidth = 4
semi = false
singleQuote = true`,
          parser: require.resolve("toml-eslint-parser"),
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
            '"trailingComma" must be equal to "es5".',
            '"trailingComma" must be equal to "none".',
            '"trailingComma" must be equal to "all".',
            '"trailingComma" must match exactly one schema in oneOf.',
            "Root must be string.",
            "Root must match exactly one schema in oneOf.",
          ],
        },
      ],
    }
  )
);
