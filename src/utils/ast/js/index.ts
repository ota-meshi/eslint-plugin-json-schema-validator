// eslint-disable-next-line eslint-comments/disable-enable-pair -- ignore
/* eslint-disable @typescript-eslint/no-explicit-any -- ignore */
import type {
    ESLintArrayExpression,
    ESLintAssignmentExpression,
    ESLintBinaryExpression,
    ESLintCallExpression,
    ESLintConditionalExpression,
    ESLintExpression,
    ESLintIdentifier,
    ESLintLiteral,
    ESLintLogicalExpression,
    ESLintMemberExpression,
    ESLintNewExpression,
    ESLintObjectExpression,
    ESLintSequenceExpression,
    ESLintTaggedTemplateExpression,
    ESLintTemplateLiteral,
    ESLintUnaryExpression,
    ESLintUpdateExpression,
} from "vue-eslint-parser/ast"
import type { RuleContext, SourceCode } from "../../../types"
import { findInitNode, getStaticValue } from "./utils"
import { getStaticPropertyName } from "./utils"

export type PathData = {
    key:
        | [number, number]
        | null
        | ((sourceCode: SourceCode) => [number, number] | null)
    data: unknown
    children: {
        [key: string]: PathData | undefined
        [key: number]: PathData | undefined
    }
}

type SubPathData = {
    data: unknown
    children: {
        [key: string]: PathData | undefined
        [key: number]: PathData | undefined
    }
}
type AnalyzedJsAST = {
    object: unknown
    pathData: PathData
}

/**
 * Analyze JavaScript AST
 */
export function analyzeJsAST(
    node: ESLintObjectExpression,
    context: RuleContext,
): AnalyzedJsAST {
    const data = getPathData(node, context)!
    const pathData: PathData = {
        key: node.range,
        ...data,
    }
    const result: AnalyzedJsAST = {
        object: data.data,
        pathData,
    }

    return result
}

const VISITORS = {
    ObjectExpression(
        node: ESLintObjectExpression,
        context: RuleContext,
    ): SubPathData {
        const data: Record<string, any> = {}
        const children: SubPathData["children"] = {}
        for (const prop of node.properties) {
            if (prop.type === "Property") {
                const keyName = getStaticPropertyName(prop, context)
                if (keyName != null) {
                    const propData = getPathData(
                        prop.value as ESLintExpression,
                        context,
                    )
                    if (propData) {
                        data[keyName] = propData.data
                        children[keyName] = {
                            key: prop.key.range,
                            ...propData,
                        }
                    }
                }
            }
        }

        return {
            data,
            children,
        }
    },
    ArrayExpression(
        node: ESLintArrayExpression,
        context: RuleContext,
    ): SubPathData {
        const data: any[] = []
        const children: SubPathData["children"] = {}
        for (let index = 0; index < node.elements.length; index++) {
            const element = node.elements[index]
            if (element) {
                if (element.type !== "SpreadElement") {
                    const propData = getPathData(element, context)
                    if (propData) {
                        data[index] = propData.data
                        children[index] = {
                            key: element.range,
                            ...propData,
                        }
                    }
                }
            } else {
                data[index] = undefined
                children[index] = {
                    key: (sourceCode) => {
                        const before = node.elements
                            .slice(0, index)
                            .reverse()
                            .find((n) => n != null)
                        let tokenIndex = before
                            ? node.elements.indexOf(before)
                            : -1
                        let token = before
                            ? sourceCode.getTokenAfter(before)!
                            : sourceCode.getFirstToken(node)
                        while (tokenIndex < index) {
                            tokenIndex++
                            token = sourceCode.getTokenAfter(token)!
                        }

                        return [
                            sourceCode.getTokenBefore(token)!.range![1],
                            token.range![0],
                        ]
                    },
                    data: undefined as any,
                    children: {},
                }
            }
        }

        return {
            data,
            children,
        }
    },
    Identifier(
        node: ESLintIdentifier,
        context: RuleContext,
    ): SubPathData | null {
        const initNode = findInitNode(context, node)
        if (initNode == null) {
            const evalData = getStaticValue(context, node)
            if (evalData != null) {
                return {
                    data: evalData.value,
                    children: {},
                }
            }

            return null
        }
        return getPathData(initNode, context)
    },
    Literal(node: ESLintLiteral, _context: RuleContext): SubPathData | null {
        return {
            data: node.value,
            children: {},
        }
    },
    UnaryExpression(
        node: ESLintUnaryExpression,
        context: RuleContext,
    ): SubPathData | null {
        const argData = getPathData(node.argument, context)
        if (argData == null) {
            return null
        }
        let data: unknown
        if (node.operator === "-") {
            data = -(argData.data as any)
        } else if (node.operator === "+") {
            data = Number(argData.data as any)
        } else if (node.operator === "!") {
            data = !(argData.data as any)
        } else if (node.operator === "~") {
            data = ~(argData.data as any)
        } else if (node.operator === "typeof") {
            data = typeof argData.data
        } else if (node.operator === "void") {
            data = undefined
        } else if (node.operator === "delete") {
            return null
        } else {
            return null
        }

        return {
            data,
            children: {},
        }
    },
    // eslint-disable-next-line complexity -- X(
    BinaryExpression(
        node: ESLintBinaryExpression,
        context: RuleContext,
    ): SubPathData | null {
        const leftData = getPathData(node.left, context)
        if (leftData == null) {
            return null
        }
        const rightData = getPathData(node.right, context)
        if (rightData == null) {
            return null
        }
        let data: unknown
        if (node.operator === "==") {
            // eslint-disable-next-line eqeqeq -- ignore
            data = leftData.data == rightData.data
        } else if (node.operator === "!=") {
            // eslint-disable-next-line eqeqeq -- ignore
            data = leftData.data != rightData.data
        } else if (node.operator === "===") {
            data = leftData.data === rightData.data
        } else if (node.operator === "!==") {
            data = leftData.data !== rightData.data
        } else if (node.operator === "<") {
            data = (leftData.data as any) < (rightData.data as any)
        } else if (node.operator === "<=") {
            data = (leftData.data as any) <= (rightData.data as any)
        } else if (node.operator === ">") {
            data = (leftData.data as any) > (rightData.data as any)
        } else if (node.operator === ">=") {
            data = (leftData.data as any) >= (rightData.data as any)
        } else if (node.operator === "<<") {
            data = (leftData.data as any) << (rightData.data as any)
        } else if (node.operator === ">>") {
            data = (leftData.data as any) >> (rightData.data as any)
        } else if (node.operator === ">>>") {
            data = (leftData.data as any) >>> (rightData.data as any)
        } else if (node.operator === "+") {
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands -- ignore
            data = (leftData.data as any) + (rightData.data as any)
        } else if (node.operator === "-") {
            data = (leftData.data as any) - (rightData.data as any)
        } else if (node.operator === "*") {
            data = (leftData.data as any) * (rightData.data as any)
        } else if (node.operator === "/") {
            data = (leftData.data as any) / (rightData.data as any)
        } else if (node.operator === "%") {
            data = (leftData.data as any) % (rightData.data as any)
        } else if (node.operator === "|") {
            data = (leftData.data as any) | (rightData.data as any)
        } else if (node.operator === "^") {
            data = (leftData.data as any) ^ (rightData.data as any)
        } else if (node.operator === "&") {
            data = (leftData.data as any) & (rightData.data as any)
        } else if (node.operator === "in") {
            data = (leftData.data as any) in (rightData.data as any)
        } else if (node.operator === "instanceof") {
            data = (leftData.data as any) instanceof (rightData.data as any)
        } else if (node.operator === "**") {
            data = (leftData.data as any) ** (rightData.data as any)
        } else {
            return null
        }

        return {
            data,
            children: {},
        }
    },
    LogicalExpression(
        node: ESLintLogicalExpression,
        context: RuleContext,
    ): SubPathData | null {
        const leftData = getPathData(node.left, context)
        if (leftData == null) {
            return null
        }
        const rightData = getPathData(node.right, context)
        if (rightData == null) {
            return null
        }
        const operator: "||" | "&&" | "??" = node.operator
        let data: unknown
        if (operator === "||") {
            data = leftData.data || rightData.data
        } else if (operator === "&&") {
            data = leftData.data && rightData.data
        } else if (operator === "??") {
            data = leftData.data ?? rightData.data
        } else {
            return null
        }

        return {
            data,
            children: {},
        }
    },
    UpdateExpression(
        node: ESLintUpdateExpression,
        context: RuleContext,
    ): SubPathData | null {
        const argData = getPathData(node.argument, context)
        if (argData == null) {
            return null
        }
        let data: unknown
        if (node.operator === "--") {
            data = Number(argData.data) - (node.prefix ? 1 : 0)
        } else if (node.operator === "++") {
            data = Number(argData.data) + (node.prefix ? 1 : 0)
        } else {
            return null
        }

        return {
            data,
            children: {},
        }
    },
    AssignmentExpression(
        node: ESLintAssignmentExpression,
        context: RuleContext,
    ): SubPathData | null {
        const rightData = getPathData(node.right, context)
        if (rightData == null) {
            return null
        }

        return rightData
    },
    MemberExpression(
        node: ESLintMemberExpression,
        context: RuleContext,
    ): SubPathData | null {
        if (node.object.type === "Super") {
            return null
        }
        const objectData = getPathData(node.object, context)
        if (objectData == null) {
            return null
        }

        const propName = getStaticPropertyName(node, context)
        if (propName == null) {
            return null
        }

        const define = objectData.children[propName]
        if (define) {
            return define
        }
        if (objectData.data != null) {
            return {
                data: (objectData.data as any)[propName],
                children: {},
            }
        }

        return null
    },
    ConditionalExpression(
        node: ESLintConditionalExpression,
        context: RuleContext,
    ): SubPathData | null {
        const testData = getPathData(node.test, context)
        if (testData == null) {
            return null
        }
        if (testData.data) {
            return getPathData(node.consequent, context)
        }
        return getPathData(node.alternate, context)
    },
    CallExpression(
        node: ESLintCallExpression,
        context: RuleContext,
    ): SubPathData | null {
        const evalData = getStaticValue(context, node)
        if (!evalData) {
            return null
        }
        return {
            data: evalData.value,
            children: {},
        }
    },
    NewExpression(
        node: ESLintNewExpression,
        context: RuleContext,
    ): SubPathData | null {
        const evalData = getStaticValue(context, node)
        if (!evalData) {
            return null
        }
        return {
            data: evalData.value,
            children: {},
        }
    },
    SequenceExpression(
        node: ESLintSequenceExpression,
        context: RuleContext,
    ): SubPathData | null {
        const last = node.expressions[node.expressions.length - 1]
        return getPathData(last, context)
    },
    TemplateLiteral(
        node: ESLintTemplateLiteral,
        context: RuleContext,
    ): SubPathData | null {
        const expressions = []
        for (const e of node.expressions) {
            const data = getPathData(e, context)
            if (data == null) {
                return null
            }
            expressions.push(data)
        }
        let data = node.quasis[0].value.cooked
        for (let i = 0; i < expressions.length; ++i) {
            data += expressions[i].data
            data += node.quasis[i + 1].value.cooked
        }
        return { data, children: {} }
    },
    TaggedTemplateExpression(
        node: ESLintTaggedTemplateExpression,
        context: RuleContext,
    ): SubPathData | null {
        const tag = getPathData(node.tag, context)
        if (tag == null) {
            return null
        }
        if (tag.data !== String.raw) {
            return null
        }
        const expressions = []
        for (const e of node.quasi.expressions) {
            const data = getPathData(e, context)
            if (data == null) {
                return null
            }
            expressions.push(data)
        }

        const strings = node.quasi.quasis.map((q) => q.value.cooked)
        ;(strings as any).raw = node.quasi.quasis.map((q) => q.value.raw)

        const data = String.raw(strings as never, ...expressions)

        return {
            data,
            children: {},
        }
    },
    ThisExpression() {
        return null
    },
    FunctionExpression() {
        return null
    },
    ArrowFunctionExpression() {
        return null
    },
    YieldExpression() {
        return null
    },
    ClassExpression() {
        return null
    },
    MetaProperty() {
        return null
    },
    AwaitExpression() {
        return null
    },
}

/**
 * Get path data
 */
function getPathData(
    node: ESLintExpression,
    context: RuleContext,
): SubPathData | null {
    const visitor = VISITORS[node.type]
    if (visitor) {
        return visitor(node as any, context)
    }
    return null
}
