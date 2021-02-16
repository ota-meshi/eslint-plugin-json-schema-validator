// eslint-disable-next-line eslint-comments/disable-enable-pair -- ignore
/* eslint-disable @typescript-eslint/no-explicit-any -- ignore */
import type {
    ESLintProperty,
    ESLintLiteral,
    ESLintTemplateLiteral,
    ESLintMemberExpression,
    ESLintIdentifier,
    ESLintNode,
    ESLintExpression,
} from "vue-eslint-parser/ast"
import type { RuleContext } from "../../../types"
// @ts-expect-error -- no type def
import * as eslintUtils from "eslint-utils"
import type { Variable } from "eslint-scope"

/**
 * Gets the property name of a given node.
 */
export function getStaticPropertyName(
    node: ESLintProperty | ESLintMemberExpression,
    context: RuleContext,
): string | null {
    let key
    if (node.type === "Property") {
        key = node.key
        if (!node.computed) {
            if (key.type === "Identifier") {
                return key.name
            }
        }
    } else if (node.type === "MemberExpression") {
        key = node.property
        if (!node.computed) {
            if (key.type === "Identifier") {
                return key.name
            }
            return null
        }
    } else {
        return null
    }
    if (key.type === "Literal" || key.type === "TemplateLiteral") {
        return getStringLiteralValue(key)
    }
    if (key.type === "Identifier") {
        const keyNode = findInitNode(context, key)
        if (keyNode) {
            if (
                keyNode.type === "Literal" ||
                keyNode.type === "TemplateLiteral"
            ) {
                return getStringLiteralValue(keyNode)
            }
        }
    }
    return null
}

/**
 * Gets the string of a given node.
 */
export function getStringLiteralValue(
    node: ESLintLiteral | ESLintTemplateLiteral,
): string | null {
    if (node.type === "Literal") {
        if (node.value == null) {
            if (!(node as any).bigint != null) {
                return (node as any).bigint
            }
            return null
        }
        return String(node.value)
    }
    if (node.type === "TemplateLiteral") {
        if (node.expressions.length === 0 && node.quasis.length === 1) {
            return node.quasis[0].value.cooked
        }
    }
    return null
}

/**
 * Find the variable of a given name.
 */
function findVariable(
    context: RuleContext,
    node: ESLintIdentifier,
): Variable | null {
    return eslintUtils.findVariable(getScope(context, node), node)
}

/**
 * Get the value of a given node if it's a static value.
 */
export function getStaticValue(
    context: RuleContext,
    node: ESLintNode,
): { value: any } | null {
    return eslintUtils.getStaticValue(node, getScope(context, node))
}

/**
 * Find the node that initial value.
 */
export function findInitNode(
    context: RuleContext,
    node: ESLintIdentifier,
): ESLintExpression | null {
    const variable = findVariable(context, node)
    if (!variable) {
        return null
    }
    if (variable.defs.length === 1) {
        const def = variable.defs[0]
        if (
            def.type === "Variable" &&
            def.parent.kind === "const" &&
            def.node.init
        ) {
            const init = def.node.init as ESLintExpression
            if (init.type === "Identifier") {
                return findInitNode(context, init)
            }

            // TODO check adds
            return init
        }
    }
    return null
}

/**
 * Gets the scope for the current node
 */
function getScope(context: RuleContext, currentNode: ESLintNode) {
    // On Program node, get the outermost scope to avoid return Node.js special function scope or ES modules scope.
    const inner = currentNode.type !== "Program"
    const scopeManager = (context.getSourceCode() as any).scopeManager

    let node: any = currentNode
    for (; node; node = node.parent || null) {
        const scope = scopeManager.acquire(node, inner)

        if (scope) {
            if (scope.type === "function-expression-name") {
                return scope.childScopes[0]
            }
            return scope
        }
    }

    return scopeManager.scopes[0]
}
