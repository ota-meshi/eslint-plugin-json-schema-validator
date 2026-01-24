import path, { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import os from "os";
// import eslint from "eslint"
import { rules } from "./lib/load-rules";
const isWin = os.platform().startsWith("win");

const FLAT_RULESET_NAME = {
  recommended: "../src/configs/flat/recommended.ts",
};

for (const rec of ["recommended"] as const) {
  let content = `
import type { Linter } from "eslint";
import base from "./base.ts";
export default [
  ...base,
  {
    rules: {
      // eslint-plugin-json-schema-validator rules
      ${rules
        .filter(
          (rule) =>
            rule.meta.docs.categories &&
            !rule.meta.deprecated &&
            rule.meta.docs.categories.includes(rec),
        )
        .map((rule) => {
          const conf = rule.meta.docs.default || "error";
          return `"${rule.meta.docs.ruleId}": "${conf}"`;
        })
        .join(",\n")}
    },
  }
] satisfies Linter.Config[]
`;

  const filePath = path.resolve(
    dirname(fileURLToPath(import.meta.url)),
    FLAT_RULESET_NAME[rec],
  );

  if (isWin) {
    content = content
      .replace(/\r?\n/gu, "\n")
      .replace(/\r/gu, "\n")
      .replace(/\n/gu, "\r\n");
  }

  // Update file.
  fs.writeFileSync(filePath, content);
}
