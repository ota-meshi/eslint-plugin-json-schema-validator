import path from "path";
const base = require.resolve("./base");
const baseExtend =
  path.extname(`${base}`) === ".ts"
    ? "plugin:json-schema-validator/base"
    : base;
export = {
  extends: [baseExtend],
  rules: {
    // eslint-plugin-json-schema-validator rules
    "json-schema-validator/no-invalid": "warn",
  },
};
