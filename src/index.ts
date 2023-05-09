import type { RuleModule } from "./types";
import { rules as ruleList } from "./utils/rules";
import base from "./configs/base";
import recommended from "./configs/recommended";
export * as meta from "./meta";

export const configs = {
  base,
  recommended,
};

export const rules = ruleList.reduce((obj, r) => {
  obj[r.meta.docs.ruleName] = r;
  return obj;
}, {} as { [key: string]: RuleModule });
