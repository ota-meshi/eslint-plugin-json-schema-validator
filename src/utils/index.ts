/* eslint @typescript-eslint/no-explicit-any: off -- util */
import type {
    RuleListener,
    RuleModule,
    PartialRuleModule,
    RuleContext,
} from "../types"
import type { Rule } from "eslint"
import type { AST as VueAST } from "vue-eslint-parser"
import * as jsoncESLintParser from "jsonc-eslint-parser"
import * as yamlESLintParser from "yaml-eslint-parser"
import * as tomlESLintParser from "toml-eslint-parser"
import path from "path"

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
            if (
                typeof context.parserServices.defineCustomBlocksVisitor ===
                    "function" &&
                path.extname(context.getFilename()) === ".vue"
            ) {
                const jsonVisitor = context.parserServices.defineCustomBlocksVisitor(
                    context,
                    jsoncESLintParser,
                    {
                        target(lang: string | null, block: VueAST.VElement) {
                            if (lang) {
                                return /^json(?:c|5)?$/i.test(lang)
                            }
                            return block.name === "i18n"
                        },
                        create(blockContext: RuleContext) {
                            return rule.create(blockContext, {
                                customBlock: true,
                            })
                        },
                    },
                )
                const yamlVisitor = context.parserServices.defineCustomBlocksVisitor(
                    context,
                    yamlESLintParser,
                    {
                        target: ["yaml", "yml"],
                        create(blockContext: RuleContext) {
                            return rule.create(blockContext, {
                                customBlock: true,
                            })
                        },
                    },
                )
                const tomlVisitor = context.parserServices.defineCustomBlocksVisitor(
                    context,
                    tomlESLintParser,
                    {
                        target: ["toml", "toml"],
                        create(blockContext: RuleContext) {
                            return rule.create(blockContext, {
                                customBlock: true,
                            })
                        },
                    },
                )
                return compositingVisitors(
                    jsonVisitor,
                    yamlVisitor,
                    tomlVisitor,
                )
            }
            return rule.create(context as any, {
                customBlock: false,
            })
        },
    }
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
                const o = visitor[key]!
                visitor[key] = (...args) => {
                    o(...args)
                    v[key]!(...args)
                }
            } else {
                visitor[key] = v[key]
            }
        }
    }
    return visitor
}
