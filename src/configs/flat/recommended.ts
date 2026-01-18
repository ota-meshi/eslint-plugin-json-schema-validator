import type { Linter } from "eslint";
import base from "./base.ts";
export default [
  ...base,
  {
    rules: {
      // eslint-plugin-json-schema-validator rules
      "json-schema-validator/no-invalid": "warn",
    },
  },
] satisfies Linter.Config[];
