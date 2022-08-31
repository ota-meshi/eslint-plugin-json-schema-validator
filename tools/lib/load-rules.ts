import path from "path";
import fs from "fs";
import type { RuleModule } from "../../src/types";

/**
 * Get the all rules
 * @returns {Array} The all rules
 */
function readRules() {
  const rules: RuleModule[] = [];
  const rulesLibRoot = path.resolve(__dirname, "../../src/rules");
  for (const name of fs
    .readdirSync(rulesLibRoot)
    .filter((n) => n.endsWith(".ts"))) {
    const ruleName = name.replace(/\.ts$/u, "");
    const ruleId = `json-schema-validator/${ruleName}`;
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires -- tool
    const rule = require(path.join(rulesLibRoot, name)).default;

    rule.meta.docs.ruleName = ruleName;
    rule.meta.docs.ruleId = ruleId;

    rules.push(rule);
  }
  return rules;
}

export const rules = readRules();
