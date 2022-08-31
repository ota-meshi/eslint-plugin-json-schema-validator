import type { AST as YAML } from "yaml-eslint-parser";
import { getStaticYAMLValue } from "yaml-eslint-parser";
import type { Token } from "../../types";
import type { GetNodeFromPath, NodeData } from "./common";

type TraverseTarget =
  | YAML.YAMLProgram
  | YAML.YAMLDocument
  | YAML.YAMLMapping
  | YAML.YAMLSequence
  | YAML.YAMLAlias
  | YAML.YAMLWithMeta;

const TRAVERSE_TARGET_TYPE: Set<string> = new Set([
  "Program",
  "YAMLDocument",
  "YAMLMapping",
  "YAMLSequence",
  "YAMLAlias",
  "YAMLWithMeta",
] as TraverseTarget["type"][]);

const GET_YAML_NODES: Record<
  TraverseTarget["type"],
  GetNodeFromPath<YAML.YAMLNode>
> = {
  Program(node: YAML.YAMLProgram, paths: string[]) {
    if (node.body.length <= 1) {
      return { value: node.body[0] };
    }
    const path = String(paths.shift());
    for (let index = 0; index < node.body.length; index++) {
      if (String(index) !== path) {
        continue;
      }
      return { value: node.body[index] };
    }
    throw new Error(`${"Unexpected state: ["}${[path, ...paths].join(", ")}]`);
  },
  YAMLDocument(node: YAML.YAMLDocument, _paths: string[]) {
    if (node.content) {
      return { value: node.content };
    }
    return {
      key: () => {
        return node.range;
      },
      value: null,
    };
  },
  YAMLMapping(node: YAML.YAMLMapping, paths: string[]) {
    const path = String(paths.shift());
    for (const pair of node.pairs) {
      const key = String(pair.key ? getStaticYAMLValue(pair.key) : null);

      if (key === path) {
        return {
          key: (sourceCode) => {
            if (pair.key) {
              return pair.key.range;
            }
            return sourceCode.getFirstToken(pair).range!;
          },
          value: pair.value,
        };
      }
    }
    throw new Error(`${"Unexpected state: ["}${[path, ...paths].join(", ")}]`);
  },
  YAMLSequence(node: YAML.YAMLSequence, paths: string[]) {
    const path = String(paths.shift());
    for (let index = 0; index < node.entries.length; index++) {
      if (String(index) !== path) {
        continue;
      }
      const entry = node.entries[index];

      if (entry) {
        return { value: entry };
      }
      return {
        key: (sourceCode) => {
          const before = node.entries
            .slice(0, index)
            .reverse()
            .find((n) => n != null);
          let hyphenTokenElementIndex: number;
          let hyphenToken: Token;
          if (!before) {
            hyphenTokenElementIndex = 0;
            hyphenToken = sourceCode.getFirstToken(node);
          } else {
            hyphenTokenElementIndex = node.entries.indexOf(before) + 1;
            hyphenToken = sourceCode.getTokenAfter(before)!;
          }
          // If it is preceded by consecutive blank elements, it must be moved to the target.
          while (hyphenTokenElementIndex < index) {
            hyphenTokenElementIndex++;
            hyphenToken = sourceCode.getTokenAfter(hyphenToken)!;
          }
          return hyphenToken.range!;
        },
        value: null,
      };
    }
    throw new Error(`${"Unexpected state: ["}${[path, ...paths].join(", ")}]`);
  },
  YAMLAlias(node: YAML.YAMLAlias, paths: string[]) {
    paths.length = 0; // consume all
    return { value: node };
  },
  YAMLWithMeta(node: YAML.YAMLWithMeta, paths: string[]) {
    if (node.value) {
      return { value: node.value };
    }
    throw new Error(`${"Unexpected state: ["}${paths.join(", ")}]`);
  },
};

/**
 * Get node from path
 */
export function getYAMLNodeFromPath(
  node: YAML.YAMLProgram,
  [...paths]: string[]
): NodeData<YAML.YAMLNode> {
  let data: NodeData<YAML.YAMLNode> = {
    key: (sourceCode) => {
      if (node.body.length > 1) {
        return sourceCode.getFirstToken(node.body[0]).range!;
      }
      const dataNode = node.body[0].content;
      if (dataNode == null) {
        return sourceCode.getFirstToken(node.body[0]).range!;
      }
      if (dataNode.type === "YAMLMapping" || dataNode.type === "YAMLSequence") {
        return sourceCode.getFirstToken(dataNode).range!;
      }
      return dataNode.range;
    },
    value: node,
  };
  while (paths.length && data.value) {
    if (!isTraverseTarget(data.value)) {
      throw new Error(`Unexpected node type: ${data.value.type}`);
    }
    data = GET_YAML_NODES[data.value.type](data.value as never, paths);
  }
  return data;
}

/**
 * Checks whether given node is traverse target.
 */
function isTraverseTarget(node: YAML.YAMLNode): node is TraverseTarget {
  return TRAVERSE_TARGET_TYPE.has(node.type);
}
