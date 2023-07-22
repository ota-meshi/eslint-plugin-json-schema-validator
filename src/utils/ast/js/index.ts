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
} from "vue-eslint-parser/ast";
import type { RuleContext, SourceCode } from "../../../types";
import { findInitNode, getStaticValue } from "./utils";
import { getStaticPropertyName } from "./utils";

const UNKNOWN = Symbol("unknown value");
type TUnknown = typeof UNKNOWN;
const EMPTY_MAP = Object.freeze(new Map());
const UNKNOWN_PATH_DATA: SubPathData = { data: UNKNOWN, children: EMPTY_MAP };
const UNKNOWN_STRING_PATH_DATA: SubPathData = {
  data: "UNKNOWN",
  children: EMPTY_MAP,
};
export type PathData = {
  key:
    | [number, number]
    | null
    | ((sourceCode: SourceCode) => [number, number] | null);
  data: unknown;
  children: Readonly<Map<string, PathData | TUnknown>>;
};

type SubPathData = Pick<PathData, "data" | "children">;
export type AnalyzedJsAST = {
  object: unknown;
  pathData: PathData;
};

/**
 * Analyze JavaScript AST
 */
export function analyzeJsAST(
  node: ESLintExpression,
  rootRange: [number, number],
  context: RuleContext,
): AnalyzedJsAST | null {
  const data = getPathData(node, context);
  if (data.data === UNKNOWN) {
    return null;
  }
  const pathData: PathData = {
    key: rootRange,
    ...data,
  };
  const result: AnalyzedJsAST = {
    object: data.data,
    pathData,
  };

  return result;
}

type UnaryOperator = "-" | "+" | "!" | "~" | "typeof" | "void" | "delete";
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
  | "**";
const CALC_UNARY: Record<UnaryOperator, null | ((v: any) => unknown)> = {
  "+": (v) => Number(v),
  "-": (v) => -v,
  "!": (v) => !v,
  "~": (v) => ~v,
  typeof: (v) => typeof v,
  void: () => undefined,
  delete: null,
};
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
};

const VISITORS = {
  ObjectExpression(
    node: ESLintObjectExpression,
    context: RuleContext,
  ): SubPathData {
    const data: Record<string, any> = {};
    const children: SubPathData["children"] = new Map();
    for (const prop of node.properties) {
      if (prop.type === "Property") {
        const keyName = getStaticPropertyName(prop, context);
        if (keyName != null) {
          const propData = getPathData(prop.value as ESLintExpression, context);
          if (propData.data !== UNKNOWN) {
            data[keyName] = propData.data;
            children.set(keyName, {
              key: prop.key.range,
              ...propData,
            });
          } else {
            data[keyName] = UNKNOWN;
            children.set(keyName, UNKNOWN);
          }
        }
      } else if (prop.type === "SpreadElement") {
        const propData = getPathData(prop.argument, context);
        propData.children.forEach((val, key) => {
          data[key] = (propData.data as any)[key];
          children.set(key, val);
        });
      }
    }

    return {
      data,
      children,
    };
  },
  ArrayExpression(
    node: ESLintArrayExpression,
    context: RuleContext,
  ): SubPathData {
    const data: any[] = [];
    const children: SubPathData["children"] = new Map();
    for (let index = 0; index < node.elements.length; index++) {
      const element = node.elements[index];
      if (element) {
        if (element.type !== "SpreadElement") {
          const propData = getPathData(element, context);
          if (propData.data !== UNKNOWN) {
            data[index] = propData.data;
            children.set(String(index), {
              key: element.range,
              ...propData,
            });
          } else {
            data[index] = UNKNOWN;
            children.set(String(index), UNKNOWN);
          }
        }
      } else {
        data[index] = undefined;
        children.set(String(index), {
          key: (sourceCode) => {
            const before = node.elements
              .slice(0, index)
              .reverse()
              .find((n) => n != null);
            let tokenIndex = before ? node.elements.indexOf(before) : -1;
            let token = before
              ? sourceCode.getTokenAfter(before)!
              : sourceCode.getFirstToken(node);
            while (tokenIndex < index) {
              tokenIndex++;
              token = sourceCode.getTokenAfter(token)!;
            }

            return [
              sourceCode.getTokenBefore(token)!.range![1],
              token.range![0],
            ];
          },
          data: undefined as any,
          children: EMPTY_MAP,
        });
      }
    }

    return {
      data,
      children,
    };
  },
  Identifier(node: ESLintIdentifier, context: RuleContext): SubPathData {
    const init = findInitNode(context, node);
    if (init == null) {
      const evalData = getStaticValue(context, node);
      if (evalData != null) {
        return {
          data: evalData.value,
          children: EMPTY_MAP,
        };
      }

      return UNKNOWN_PATH_DATA;
    }
    const data = getPathData(init.node, context);
    if (typeof data.data === "object" && data.data != null) {
      for (const readId of init.reads) {
        const props = getWriteProps(readId);
        if (props == null) {
          continue;
        }
        let objData = data;
        let obj: Record<string, any> = data.data;
        while (props.length) {
          const prop = props.shift()!;
          const child = objData.children.get(prop);
          if (child) {
            if (child === UNKNOWN) {
              break;
            }
            const nextObj = obj[prop];
            if (typeof nextObj === "object" && nextObj != null) {
              objData = child;
              obj = obj[prop];
            } else {
              break;
            }
          } else {
            obj[prop] = UNKNOWN;
            objData.children.set(prop, UNKNOWN);
            break;
          }
        }
      }
    }
    return data;

    /**
     * Get write properties from given Identifier
     */
    function getWriteProps(id: ESLintIdentifier) {
      if (
        !id.parent ||
        id.parent.type !== "MemberExpression" ||
        id.parent.object !== id
      ) {
        return null;
      }
      const results: string[] = [];
      let mem = id.parent;
      while (mem) {
        const name = getStaticPropertyName(mem, context);
        if (name == null) {
          break;
        }
        results.push(name);
        if (
          !mem.parent ||
          mem.parent.type !== "MemberExpression" ||
          mem.parent.object !== mem
        ) {
          break;
        }
        mem = mem.parent;
      }
      if (!mem.parent || mem.parent.type !== "AssignmentExpression") {
        return null;
      }
      return results;
    }
  },
  Literal(node: ESLintLiteral, _context: RuleContext): SubPathData {
    return {
      data: node.value,
      children: EMPTY_MAP,
    };
  },
  UnaryExpression(
    node: ESLintUnaryExpression,
    context: RuleContext,
  ): SubPathData {
    const argData = getPathData(node.argument, context);
    if (argData.data === UNKNOWN) {
      return UNKNOWN_PATH_DATA;
    }
    const calc = CALC_UNARY[node.operator];
    if (!calc) {
      return UNKNOWN_PATH_DATA;
    }
    const data: unknown = calc(argData.data);

    return {
      data,
      children: EMPTY_MAP,
    };
  },
  BinaryExpression(
    node: ESLintBinaryExpression,
    context: RuleContext,
  ): SubPathData {
    if (node.left.type === "PrivateIdentifier") {
      return UNKNOWN_PATH_DATA;
    }
    const leftData = getPathData(node.left, context);
    if (leftData.data === UNKNOWN) {
      return UNKNOWN_PATH_DATA;
    }
    const rightData = getPathData(node.right, context);
    if (rightData.data === UNKNOWN) {
      return UNKNOWN_PATH_DATA;
    }
    const calc = CALC_BINARY[node.operator];
    if (!calc) {
      return UNKNOWN_PATH_DATA;
    }
    const data: unknown = calc(leftData.data, rightData.data);

    return {
      data,
      children: EMPTY_MAP,
    };
  },
  LogicalExpression(
    node: ESLintLogicalExpression,
    context: RuleContext,
  ): SubPathData {
    const leftData = getPathData(node.left, context);
    if (leftData.data === UNKNOWN) {
      return UNKNOWN_PATH_DATA;
    }
    const operator: "||" | "&&" | "??" = node.operator;
    if (operator === "||") {
      if (leftData.data) {
        return leftData;
      }
    } else if (operator === "&&") {
      if (!leftData.data) {
        return leftData;
      }
    } else if (operator === "??") {
      if (leftData.data != null) {
        return leftData;
      }
    } else {
      return UNKNOWN_PATH_DATA;
    }
    const rightData = getPathData(node.right, context);
    return rightData;
  },
  AssignmentExpression(
    node: ESLintAssignmentExpression,
    context: RuleContext,
  ): SubPathData {
    const rightData = getPathData(node.right, context);
    return rightData;
  },
  MemberExpression(
    node: ESLintMemberExpression,
    context: RuleContext,
  ): SubPathData {
    if (node.object.type === "Super") {
      return UNKNOWN_PATH_DATA;
    }
    const objectData = getPathData(node.object, context);
    if (objectData.data === UNKNOWN) {
      return UNKNOWN_PATH_DATA;
    }

    const propName = getStaticPropertyName(node, context);
    if (propName == null) {
      return UNKNOWN_PATH_DATA;
    }

    const define = objectData.children.get(propName);
    if (define && define !== UNKNOWN) {
      return define;
    }
    if (objectData.data != null) {
      return {
        data: (objectData.data as any)[propName],
        children: EMPTY_MAP,
      };
    }

    return UNKNOWN_PATH_DATA;
  },
  ConditionalExpression(
    node: ESLintConditionalExpression,
    context: RuleContext,
  ): SubPathData {
    const testData = getPathData(node.test, context);
    if (testData.data === UNKNOWN) {
      return UNKNOWN_PATH_DATA;
    }
    if (testData.data) {
      return getPathData(node.consequent, context);
    }
    return getPathData(node.alternate, context);
  },
  CallExpression(
    node: ESLintCallExpression,
    context: RuleContext,
  ): SubPathData {
    const evalData = getStaticValue(context, node);
    if (!evalData) {
      if (
        node.callee.type === "MemberExpression" &&
        node.callee.object.type === "Identifier" &&
        node.callee.object.name === "require" &&
        getStaticPropertyName(node.callee, context) === "resolve"
      ) {
        return UNKNOWN_STRING_PATH_DATA;
      }
      return UNKNOWN_PATH_DATA;
    }
    return {
      data: evalData.value,
      children: EMPTY_MAP,
    };
  },
  NewExpression(node: ESLintNewExpression, context: RuleContext): SubPathData {
    const evalData = getStaticValue(context, node);
    if (!evalData) {
      return UNKNOWN_PATH_DATA;
    }
    return {
      data: evalData.value,
      children: EMPTY_MAP,
    };
  },
  SequenceExpression(
    node: ESLintSequenceExpression,
    context: RuleContext,
  ): SubPathData {
    const last = node.expressions[node.expressions.length - 1];
    return getPathData(last, context);
  },
  TemplateLiteral(
    node: ESLintTemplateLiteral,
    context: RuleContext,
  ): SubPathData {
    const expressions = [];
    for (const e of node.expressions) {
      const data = getPathData(e, context);
      if (data.data === UNKNOWN) {
        return UNKNOWN_STRING_PATH_DATA;
      }
      expressions.push(data.data);
    }
    let data = node.quasis[0].value.cooked ?? node.quasis[0].value.raw;
    for (let i = 0; i < expressions.length; ++i) {
      data += String(expressions[i]);
      data += node.quasis[i + 1].value.cooked ?? node.quasis[i + 1].value.raw;
    }
    return { data, children: EMPTY_MAP };
  },
  TaggedTemplateExpression(
    node: ESLintTaggedTemplateExpression,
    context: RuleContext,
  ): SubPathData {
    const tag = getPathData(node.tag, context);
    if (tag.data === UNKNOWN) {
      return UNKNOWN_PATH_DATA;
    }
    if (tag.data !== String.raw) {
      return UNKNOWN_PATH_DATA;
    }
    const expressions = [];
    for (const e of node.quasi.expressions) {
      const data = getPathData(e, context);
      if (data.data === UNKNOWN) {
        return UNKNOWN_PATH_DATA;
      }
      expressions.push(data.data);
    }

    const strings = node.quasi.quasis.map((q) => q.value.cooked);
    (strings as any).raw = node.quasi.quasis.map((q) => q.value.raw);

    const data = String.raw(strings as never, ...expressions);

    return {
      data,
      children: EMPTY_MAP,
    };
  },
  UpdateExpression() {
    return UNKNOWN_PATH_DATA;
  },
  ThisExpression() {
    return UNKNOWN_PATH_DATA;
  },
  FunctionExpression() {
    return UNKNOWN_PATH_DATA;
  },
  ArrowFunctionExpression() {
    return UNKNOWN_PATH_DATA;
  },
  YieldExpression() {
    return UNKNOWN_PATH_DATA;
  },
  ClassExpression() {
    return UNKNOWN_PATH_DATA;
  },
  MetaProperty() {
    return UNKNOWN_PATH_DATA;
  },
  AwaitExpression() {
    return UNKNOWN_PATH_DATA;
  },
  ChainExpression() {
    return UNKNOWN_PATH_DATA;
  },
};

/**
 * Get path data
 */
function getPathData(
  node: ESLintExpression,
  context: RuleContext,
): SubPathData {
  const visitor = VISITORS[node.type];
  if (visitor) {
    return visitor(node as any, context);
  }
  return UNKNOWN_PATH_DATA;
}
