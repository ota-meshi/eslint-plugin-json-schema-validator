import type { AST as JSON } from "jsonc-eslint-parser"
import type { GetNodeFromPath, NodeData } from "./common"

type TraverseTarget =
    | JSON.JSONProgram
    | JSON.JSONExpressionStatement
    | JSON.JSONObjectExpression
    | JSON.JSONArrayExpression

const TRAVERSE_TARGET_TYPE: Set<string> = new Set([
    "Program",
    "JSONExpressionStatement",
    "JSONObjectExpression",
    "JSONArrayExpression",
] as TraverseTarget["type"][])

const GET_JSON_NODES: Record<
    TraverseTarget["type"],
    GetNodeFromPath<JSON.JSONNode>
> = {
    Program(node: JSON.JSONProgram, _paths: string[]) {
        return { value: node.body[0] }
    },
    JSONExpressionStatement(
        node: JSON.JSONExpressionStatement,
        _paths: string[],
    ) {
        return { value: node.expression }
    },
    JSONObjectExpression(node: JSON.JSONObjectExpression, paths: string[]) {
        const path = String(paths.shift())
        for (const prop of node.properties) {
            if (prop.key.type === "JSONIdentifier") {
                if (prop.key.name === path) {
                    return { key: () => prop.key.range, value: prop.value }
                }
            } else {
                if (String(prop.key.value) === path) {
                    return { key: () => prop.key.range, value: prop.value }
                }
            }
        }
        throw new Error(
            `${"Unexpected state: ["}${[path, ...paths].join(", ")}]`,
        )
    },
    JSONArrayExpression(node: JSON.JSONArrayExpression, paths: string[]) {
        const path = String(paths.shift())
        for (let index = 0; index < node.elements.length; index++) {
            if (String(index) !== path) {
                continue
            }
            const element = node.elements[index]

            if (element) {
                return { value: element }
            }
            return {
                key: (sourceCode) => {
                    const before = node.elements
                        .slice(0, index)
                        .reverse()
                        .find((n) => n != null)
                    let tokenIndex = before ? node.elements.indexOf(before) : -1
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
                value: null,
            }
        }
        throw new Error(
            `${"Unexpected state: ["}${[path, ...paths].join(", ")}]`,
        )
    },
}
/**
 * Get node from path
 */
export function getJSONNodeFromPath(
    node: JSON.JSONProgram,
    [...paths]: string[],
): NodeData<JSON.JSONNode> {
    let data: NodeData<JSON.JSONNode> = {
        value: node,
    }
    while (paths.length && data.value) {
        if (!isTraverseTarget(data.value)) {
            throw new Error(`Unexpected node type: ${data.value.type}`)
        }
        data = GET_JSON_NODES[data.value.type](data.value as never, paths)
    }
    return data
}

/**
 * Checks whether given node is traverse target.
 */
function isTraverseTarget(node: JSON.JSONNode): node is TraverseTarget {
    return TRAVERSE_TARGET_TYPE.has(node.type)
}
