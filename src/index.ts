import type { RuleModule } from "./types.ts";
import { rules as ruleList } from "./utils/rules.ts";
import base from "./configs/flat/base.ts";
import recommended from "./configs/flat/recommended.ts";
import * as meta from "./meta.ts";
import type { Linter } from "eslint";

const configs = {
  base: base as Linter.Config[],
  recommended: recommended as Linter.Config[],
  // Kept for backward compatibility
  "flat/base": base as Linter.Config[],
  "flat/recommended": recommended as Linter.Config[],
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
