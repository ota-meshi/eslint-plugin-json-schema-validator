import type { AST as YAML } from "yaml-eslint-parser";
import { getStaticYAMLValue } from "yaml-eslint-parser";
import type { Token } from "../../types";
import type { GetLoc, GetNodeFromPath, NodeData } from "./common";

type TraverseTarget =
  | YAML.YAMLDocument
  | YAML.YAMLMapping
  | YAML.YAMLSequence
  | YAML.YAMLAlias
  | YAML.YAMLWithMeta;

const TRAVERSE_TARGET_TYPE: Set<string> = new Set([
  "YAMLDocument",
  "YAMLMapping",
  "YAMLSequence",
  "YAMLAlias",
  "YAMLWithMeta",
] as TraverseTarget["type"][]);

// The YAML merge key. Keys of the mapping referenced by `<<` are merged into
// the enclosing mapping. See https://yaml.org/type/merge.html
const MERGE_KEY = "<<";

const GET_YAML_NODES: Record<
  TraverseTarget["type"],
  GetNodeFromPath<YAML.YAMLNode>
> = {
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

    // A directly-defined key takes precedence over a merged one, so look for a
    // direct match first.
    for (const pair of node.pairs) {
      const key = String(pair.key ? getStaticYAMLValue(pair.key) : null);

      if (key === path) {
        return { key: pairKeyRange(pair), value: pair.value };
      }
    }

    // Otherwise the key was introduced by a merge key (`<<`): the validated
    // value is the merged mapping, so any error path segment that is not a
    // direct key must have come from a mergeable `<<` pair.
    for (const pair of node.pairs) {
      if (isMergeKeyPair(pair) && isMergeable(pair.value)) {
        // The whole merged mapping is validated as a single unit, so consume
        // the remaining paths and report at the `<<` pair.
        paths.length = 0;
        return {
          key: pairKeyRange(pair),
          value: pair.value,
          fromMergeKey: true,
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
 * Get node from path, relative to a single YAML document.
 */
export function getYAMLNodeFromPath(
  document: YAML.YAMLDocument,
  [...paths]: string[],
): NodeData<YAML.YAMLNode> {
  let data: NodeData<YAML.YAMLNode> = {
    key: (sourceCode) => {
      const dataNode = document.content;
      if (dataNode == null) {
        return (sourceCode.getFirstToken(document) || document).range!;
      }
      if (dataNode.type === "YAMLMapping" || dataNode.type === "YAMLSequence") {
        return sourceCode.getFirstToken(dataNode).range!;
      }
      return dataNode.range;
    },
    value: document,
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

/**
 * Builds the location accessor for a pair's key, falling back to the pair's
 * first token when the key has no node (e.g. an empty key).
 */
function pairKeyRange(pair: YAML.YAMLPair): GetLoc {
  return (sourceCode) =>
    pair.key ? pair.key.range : sourceCode.getFirstToken(pair).range!;
}

/**
 * Checks whether the given pair is a YAML merge key pair (a plain `<<` key).
 * A quoted `<<` is a normal key, so only a plain scalar counts, matching
 * `getStaticYAMLValue`.
 */
function isMergeKeyPair(
  pair: YAML.YAMLPair,
): pair is YAML.YAMLPair & { value: YAML.YAMLContent | YAML.YAMLWithMeta } {
  const key = pair.key;
  return (
    pair.value != null &&
    key != null &&
    key.type === "YAMLScalar" &&
    key.style === "plain" &&
    key.strValue === MERGE_KEY
  );
}

/**
 * Checks whether the value of a merge-key node can actually be merged, i.e.
 * whether it resolves to a mapping (or a sequence of mappings). This mirrors
 * the merge resolution in `getStaticYAMLValue`, so a `<<` pair is only treated
 * as a merge source here when its keys were actually merged into the value.
 *
 * Only the top-level shape is checked; which keys the merge contributes cannot
 * be tested here, because `getStaticYAMLValue` on a sub-node has no document
 * version context and so does not resolve merge keys nested inside the source
 * (e.g. a transitive `<<` in an anchored mapping).
 */
function isMergeable(value: YAML.YAMLContent | YAML.YAMLWithMeta): boolean {
  const resolved = getStaticYAMLValue(value);

  return (
    isPlainObject(resolved) ||
    (Array.isArray(resolved) && resolved.every(isPlainObject))
  );
}

/**
 * Checks whether the given value is a plain object (a resolved YAML mapping).
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
