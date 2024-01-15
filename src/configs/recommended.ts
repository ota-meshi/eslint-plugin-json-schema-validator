import path from "path";
const base = require.resolve("./base");
const baseExtend =
  path.extname(`${base}`) === ".ts"
    ? "plugin:json-schema-validator/base"
    : base;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- ignore
// @ts-ignore -- backward compatibility
export = {
  extends: [baseExtend],
  rules: {
    // eslint-plugin-json-schema-validator rules
    "json-schema-validator/no-invalid": "warn",
  },
};
