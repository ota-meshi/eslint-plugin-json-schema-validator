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
} from "vue-eslint-parser/ast"
import type { RuleContext, SourceCode } from "../../../types"
import { findInitNode, getStaticValue } from "./utils"
import { getStaticPropertyName } from "./utils"

const EMPTY_MAP = Object.freeze(new Map())
export type PathData = {
    key:
        | [number, number]
        | null
        | ((sourceCode: SourceCode) => [number, number] | null)
    data: unknown
    children: Readonly<Map<string, PathData | undefined>>
}

type SubPathData = {
    data: unknown
    children: Readonly<Map<string, PathData | undefined>>
}
export type AnalyzedJsAST = {
    object: unknown
    pathData: PathData
}

/**
 * Analyze JavaScript AST
 */
export function analyzeJsAST(
    node: ESLintExpression,
    context: RuleContext,
): AnalyzedJsAST | null {
    const data = getPathData(node, context)
    if (data == null) {
        return null
    }
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

type UnaryOperator = "-" | "+" | "!" | "~" | "typeof" | "void" | "delete"
type BinaryOperator =
    | "=="
    | "!="
    | "==="
    | "!=="
    | "<"
    | "<="
    | ">"
    | ">="
    | "<<"
    | ">>"
    | ">>>"
    | "+"
    | "-"
    | "*"
    | "/"
    | "%"
    | "|"
    | "^"
    | "&"
    | "in"
    | "instanceof"
    | "**"
const CALC_UNARY: Record<UnaryOperator, null | ((v: any) => unknown)> = {
    "+": (v) => Number(v),
    "-": (v) => -v,
    "!": (v) => !v,
    "~": (v) => ~v,
    typeof: (v) => typeof v,
    void: () => undefined,
    delete: null,
}
const CALC_BINARY: Record<
    BinaryOperator,
    null | ((v1: any, v2: any) => unknown)
> = {
    // eslint-disable-next-line eqeqeq -- ignore
    "==": (v1, v2) => v1 == v2,
    // eslint-disable-next-line eqeqeq -- ignore
    "!=": (v1, v2) => v1 != v2,
    "===": (v1, v2) => v1 === v2,
    "!==": (v1, v2) => v1 !== v2,
    "<": (v1, v2) => v1 < v2,
    "<=": (v1, v2) => v1 <= v2,
    ">": (v1, v2) => v1 > v2,
    ">=": (v1, v2) => v1 >= v2,
    "<<": (v1, v2) => v1 << v2,
    ">>": (v1, v2) => v1 >> v2,
    ">>>": (v1, v2) => v1 >>> v2,
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands -- ignore
    "+": (v1, v2) => v1 + v2,
    "-": (v1, v2) => v1 - v2,
    "*": (v1, v2) => v1 * v2,
    "/": (v1, v2) => v1 / v2,
    "%": (v1, v2) => v1 % v2,
    "|": (v1, v2) => v1 | v2,
    "^": (v1, v2) => v1 ^ v2,
    "&": (v1, v2) => v1 & v2,
    in: (v1, v2) => v1 in v2,
    instanceof: (v1, v2) => v1 instanceof v2,
    "**": (v1, v2) => v1 ** v2,
}

const VISITORS = {
    ObjectExpression(
        node: ESLintObjectExpression,
        context: RuleContext,
    ): SubPathData {
        const data: Record<string, any> = {}
        const children: SubPathData["children"] = new Map()
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
                        children.set(keyName, {
                            key: prop.key.range,
                            ...propData,
                        })
                    }
                }
            } else if (prop.type === "SpreadElement") {
                const propData = getPathData(prop.argument, context)
                if (propData) {
                    propData.children.forEach((val, key) => {
                        data[key] = (propData.data as any)[key]
                        children.set(key, val)
                    })
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
        const children: SubPathData["children"] = new Map()
        for (let index = 0; index < node.elements.length; index++) {
            const element = node.elements[index]
            if (element) {
                if (element.type !== "SpreadElement") {
                    const propData = getPathData(element, context)
                    if (propData) {
                        data[index] = propData.data
                        children.set(String(index), {
                            key: element.range,
                            ...propData,
                        })
                    }
                }
            } else {
                data[index] = undefined
                children.set(String(index), {
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
                    children: EMPTY_MAP,
                })
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
                    children: EMPTY_MAP,
                }
            }

            return null
        }
        return getPathData(initNode, context)
    },
    Literal(node: ESLintLiteral, _context: RuleContext): SubPathData | null {
        return {
            data: node.value,
            children: EMPTY_MAP,
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
        const calc = CALC_UNARY[node.operator]
        if (!calc) {
            return null
        }
        const data: unknown = calc(argData.data)

        return {
            data,
            children: EMPTY_MAP,
        }
    },
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
        const calc = CALC_BINARY[node.operator]
        if (!calc) {
            return null
        }
        const data: unknown = calc(leftData.data, rightData.data)

        return {
            data,
            children: EMPTY_MAP,
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
        const operator: "||" | "&&" | "??" = node.operator
        if (operator === "||") {
            if (leftData.data) {
                return leftData
            }
        } else if (operator === "&&") {
            if (!leftData.data) {
                return leftData
            }
        } else if (operator === "??") {
            if (leftData.data != null) {
                return leftData
            }
        } else {
            return null
        }
        const rightData = getPathData(node.right, context)
        if (rightData == null) {
            return null
        }
        return rightData
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

        const define = objectData.children.get(propName)
        if (define) {
            return define
        }
        if (objectData.data != null) {
            return {
                data: (objectData.data as any)[propName],
                children: EMPTY_MAP,
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
            children: EMPTY_MAP,
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
            children: EMPTY_MAP,
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
            expressions.push(data.data)
        }
        let data = node.quasis[0].value.cooked
        for (let i = 0; i < expressions.length; ++i) {
            data += expressions[i]
            data += node.quasis[i + 1].value.cooked
        }
        return { data, children: EMPTY_MAP }
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
            expressions.push(data.data)
        }

        const strings = node.quasi.quasis.map((q) => q.value.cooked)
        ;(strings as any).raw = node.quasi.quasis.map((q) => q.value.raw)

        const data = String.raw(strings as never, ...expressions)

        return {
            data,
            children: EMPTY_MAP,
        }
    },
    UpdateExpression() {
        return null
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
