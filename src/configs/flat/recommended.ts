import base from "./base";
export default [
  ...base,
  {
    rules: {
      // eslint-plugin-json-schema-validator rules
      "json-schema-validator/no-invalid": "warn",
    },
  },
];
