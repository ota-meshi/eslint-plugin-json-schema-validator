/* eslint @typescript-eslint/no-explicit-any: off -- util */
import type {
  RuleListener,
  RuleModule,
  PartialRuleModule,
  RuleContext,
} from "../types.ts";
import type { Rule } from "eslint";
import type { AST as VueAST } from "vue-eslint-parser";
import * as jsoncESLintParser from "jsonc-eslint-parser";
import * as yamlESLintParser from "yaml-eslint-parser";
import * as tomlESLintParser from "toml-eslint-parser";
import path from "path";
import { getFilename, getSourceCode } from "./compat.ts";

/**
 * Define the rule.
 * @param ruleName ruleName
 * @param rule rule module
 */
export function createRule(
  ruleName: string,
  rule: PartialRuleModule,
): RuleModule {
  return {
    meta: {
      ...rule.meta,
      docs: {
        ...rule.meta.docs,
        url: `https://ota-meshi.github.io/eslint-plugin-json-schema-validator/rules/${ruleName}.html`,
        ruleId: `json-schema-validator/${ruleName}`,
        ruleName,
      },
    },
    create(context: Rule.RuleContext): any {
      const sourceCode = getSourceCode(context);
      const filename = getFilename(context);
      const visitor = rule.create(context as any, {
        customBlock: false,
        filename,
      });
      if (
        typeof sourceCode.parserServices.defineCustomBlocksVisitor ===
          "function" &&
        path.extname(filename) === ".vue"
      ) {
        const jsonVisitor = sourceCode.parserServices.defineCustomBlocksVisitor(
          context,
          jsoncESLintParser,
          {
            target(lang: string | null, block: VueAST.VElement) {
              if (lang) {
                return /^json[5c]?$/i.test(lang);
              }
              return block.name === "i18n";
            },
            create(blockContext: RuleContext) {
              return rule.create(blockContext, {
                customBlock: true,
                filename: getBlockFileName(
                  blockContext.parserServices.customBlock!,
                  "json",
                ),
              });
            },
          },
        );
        const yamlVisitor = sourceCode.parserServices.defineCustomBlocksVisitor(
          context,
          yamlESLintParser,
          {
            target: ["yaml", "yml"],
            create(blockContext: RuleContext) {
              return rule.create(blockContext, {
                customBlock: true,
                filename: getBlockFileName(
                  blockContext.parserServices.customBlock!,
                  "yaml",
                ),
              });
            },
          },
        );
        const tomlVisitor = sourceCode.parserServices.defineCustomBlocksVisitor(
          context,
          tomlESLintParser,
          {
            target: ["toml"],
            create(blockContext: RuleContext) {
              return rule.create(blockContext, {
                customBlock: true,
                filename: getBlockFileName(
                  blockContext.parserServices.customBlock!,
                  "toml",
                ),
              });
            },
          },
        );

        return compositingVisitors(
          visitor,
          jsonVisitor,
          yamlVisitor,
          tomlVisitor,
        );
      }

      return visitor;

      /** Get file name of block */
      function getBlockFileName(
        customBlock: VueAST.VElement,
        langFallback: string,
      ): string {
        const attrs: Record<string, string | null> = {};
        for (const attr of customBlock.startTag.attributes) {
          if (!attr.directive) {
            attrs[attr.key.name] = attr.value?.value ?? null;
          }
        }
        const ext = attrs.lang || langFallback;

        let attrQuery = "";
        for (const [key, val] of Object.entries(attrs)) {
          if (["id", "index", "src", "type"].includes(key)) {
            continue;
          }
          attrQuery += `&${key}=${val}`;
        }

        const result = `${customBlock.name}.${ext}`;
        return `${filename}/${result}?vue&type=custom&blockType=${customBlock.name}${attrQuery}`;
      }
    },
  };
}

/**
 * Compositing visitors
 */
function compositingVisitors(
  visitor: RuleListener,
  ...visitors: RuleListener[]
): RuleListener {
  for (const v of visitors) {
    for (const key in v) {
      if (visitor[key]) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- false positive?
        const o = visitor[key]!;
        visitor[key] = (...args) => {
          o(...args);
          v[key]!(...args);
        };
      } else {
        visitor[key] = v[key];
      }
    }
  }
  return visitor;
}
