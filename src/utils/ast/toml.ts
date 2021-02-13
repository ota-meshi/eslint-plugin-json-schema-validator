import type { AST as TOML } from "toml-eslint-parser"
import { getStaticTOMLValue } from "toml-eslint-parser"
import type { GetNodeFromPath, NodeData } from "./common"

const enum MatchType {
    notMatch,
    match,
    beginsMatch,
    subMatch,
}

type TraverseTarget = TOML.TOMLArray | TOML.TOMLInlineTable

const TRAVERSE_TARGET_TYPE: Set<string> = new Set([
    "TOMLArray",
    "TOMLInlineTable",
] as TraverseTarget["type"][])

const GET_TOML_NODES: Record<
    TraverseTarget["type"],
    GetNodeFromPath<TOML.TOMLNode>
> = {
    TOMLArray(node: TOML.TOMLArray, paths: string[]) {
        const path = String(paths.shift())
        for (let index = 0; index < node.elements.length; index++) {
            if (String(index) !== path) {
                continue
            }
            const element = node.elements[index]
            return { value: element }
        }
        throw new Error(
            `${"Unexpected state: ["}${[path, ...paths].join(", ")}]`,
        )
    },
    TOMLInlineTable(node: TOML.TOMLInlineTable, paths: string[]) {
        for (const body of node.body) {
            const keys = getStaticTOMLValue(body.key)
            const m = getMatchType(paths, keys)
            if (m === MatchType.match) {
                paths.length = 0 // consume all
                return { value: body.key }
            }
            if (m === MatchType.subMatch) {
                paths.length = 0 // consume all
                return { value: body.key }
            }
            if (m === MatchType.beginsMatch) {
                for (let index = 0; index < keys.length; index++) {
                    paths.shift()
                }
                return { key: () => body.key.range, value: body.value }
            }
        }
        throw new Error(`${"Unexpected state: ["}${paths.join(", ")}]`)
    },
}

/**
 * Get node from path
 */
export function getTOMLNodeFromPath(
    node: TOML.TOMLProgram,
    paths: string[],
): NodeData<TOML.TOMLNode> {
    const topLevelTable = node.body[0]

    for (const body of topLevelTable.body) {
        if (body.type === "TOMLKeyValue") {
            const result = getTOMLNodeFromPathForKeyValue(body, paths)
            if (result) {
                return result
            }
        } else {
            // Table
            const m = getMatchType(paths, body.resolvedKey)
            if (m === MatchType.match) {
                return { value: body.key }
            }
            if (m === MatchType.subMatch) {
                return { value: body.key }
            }
            if (m === MatchType.beginsMatch) {
                const nextKeys = paths.slice(body.resolvedKey.length)
                for (const keyVal of body.body) {
                    const result = getTOMLNodeFromPathForKeyValue(
                        keyVal,
                        nextKeys,
                    )
                    if (result) {
                        return result
                    }
                }
            }
        }
    }
    throw new Error(`${"Unexpected state: ["}${paths.join(", ")}]`)
}

/**
 * Get node from path for KeyValue node
 */
function getTOMLNodeFromPathForKeyValue(
    node: TOML.TOMLKeyValue,
    paths: string[],
): NodeData<TOML.TOMLNode> | null {
    const keys = getStaticTOMLValue(node.key)
    const m = getMatchType(paths, keys)
    if (m === MatchType.match) {
        return { value: node.key }
    }
    if (m === MatchType.subMatch) {
        return { value: node.key }
    }
    if (m === MatchType.beginsMatch) {
        const nextKeys = paths.slice(keys.length)
        return getTOMLNodeFromPathForContent(node.value, nextKeys)
    }
    return null
}

/**
 * Get node from path for content node
 */
function getTOMLNodeFromPathForContent(
    node: TOML.TOMLContentNode,
    [...paths]: string[],
): NodeData<TOML.TOMLNode> {
    let data: NodeData<TOML.TOMLNode> = {
        value: node,
    }
    while (paths.length && data.value) {
        if (!isTraverseTarget(data.value)) {
            throw new Error(`Unexpected node type: ${data.value.type}`)
        }
        data = GET_TOML_NODES[data.value.type](data.value as never, paths)
    }
    return data
}

/**
 * Checks whether given node is traverse target.
 */
function isTraverseTarget(node: TOML.TOMLNode): node is TraverseTarget {
    return TRAVERSE_TARGET_TYPE.has(node.type)
}

/**
 * Checks if the given key is a prefix match.
 */
function getMatchType(paths: string[], keys: (string | number)[]): MatchType {
    if (keys.length <= paths.length) {
        if (!keys.every((key, index) => String(key) === String(paths[index]))) {
            return MatchType.notMatch
        }
        return keys.length === paths.length
            ? MatchType.match
            : MatchType.beginsMatch
    }

    return paths.every((path, index) => String(path) === String(keys[index]))
        ? MatchType.subMatch
        : MatchType.notMatch
}
