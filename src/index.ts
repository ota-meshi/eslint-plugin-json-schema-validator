import type { RuleModule } from "./types";
import { rules as ruleList } from "./utils/rules";
import base from "./configs/flat/base";
import recommended from "./configs/flat/recommended";
import * as meta from "./meta";

const configs = {
  base,
  recommended,
  // Kept for backward compatibility
  "flat/base": base,
  "flat/recommended": recommended,
};

const rules = ruleList.reduce(
  (obj, r) => {
    obj[r.meta.docs.ruleName] = r;
    return obj;
  },
  {} as { [key: string]: RuleModule },
);

export default {
  meta,
  configs,
  rules,
};
export { meta, configs, rules };
