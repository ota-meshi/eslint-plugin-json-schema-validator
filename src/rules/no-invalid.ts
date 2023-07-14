import type { AST as JSONAST } from "jsonc-eslint-parser";
import { getStaticJSONValue } from "jsonc-eslint-parser";
import type { AST as YAML } from "yaml-eslint-parser";
import { getStaticYAMLValue } from "yaml-eslint-parser";
import type { AST as TOML } from "toml-eslint-parser";
import { getStaticTOMLValue } from "toml-eslint-parser";
import { createRule } from "../utils";
import minimatch from "minimatch";
import path from "path";
import type { PathData } from "../utils/ast";
import {
  getJSONNodeFromPath,
  getYAMLNodeFromPath,
  getTOMLNodeFromPath,
  analyzeJsAST,
} from "../utils/ast";
import { loadJson, loadSchema } from "../utils/schema";
import type { RuleContext } from "../types";
import type { NodeData } from "../utils/ast/common";
import type {
  ESLintAssignmentExpression,
  ESLintExportDefaultDeclaration,
  ESLintExpression,
} from "vue-eslint-parser/ast";
import type { ValidateError, Validator } from "../utils/validator-factory";
import { compile } from "../utils/validator-factory";
import type { SchemaObject } from "../utils/types";
import fs from "fs";

const CATALOG_URL = "https://www.schemastore.org/api/json/catalog.json";

/**
 * Checks if match file
 */
function matchFile(filename: string, fileMatch: string[]) {
  return (
    fileMatch.includes(path.basename(filename)) ||
    fileMatch.some((fm) => minimatch(filename, fm, { dot: true }))
  );
}

/**
 * Parse option
 */
function parseOption(
  option:
    | {
        schemas?: {
          name?: string;
          description?: string;
          fileMatch: string[];
          schema: SchemaObject | string;
        }[];
        useSchemastoreCatalog?: boolean;
      }
    | string,
  context: RuleContext,
  filename: string,
): Validator | null {
  if (typeof option === "string") {
    return schemaPathToValidator(option, context);
  }

  const validators: Validator[] = [];

  for (const schemaData of option.schemas || []) {
    if (!matchFile(filename, schemaData.fileMatch)) {
      continue;
    }
    if (typeof schemaData.schema === "string") {
      const validator = schemaPathToValidator(schemaData.schema, context);
      if (validator) {
        validators.push(validator);
      } else {
        reportCannotResolvedPath(schemaData.schema, context);
      }
    } else {
      const validator = schemaObjectToValidator(schemaData.schema, context);
      if (validator) {
        validators.push(validator);
      } else {
        reportCannotResolvedObject(context);
      }
    }
  }
  if (!validators.length) {
    // If it matches the user's definition, don't use `catalog.json`.
    if (option.useSchemastoreCatalog !== false) {
      const catalog = loadJson(CATALOG_URL, context);
      if (!catalog) {
        return null;
      }

      const schemas: {
        name?: string;
        description?: string;
        fileMatch: string[];
        url: string;
      }[] = catalog.schemas;

      for (const schemaData of schemas) {
        if (!schemaData.fileMatch) {
          continue;
        }
        if (!matchFile(filename, schemaData.fileMatch)) {
          continue;
        }
        const validator = schemaPathToValidator(schemaData.url, context);
        if (validator) validators.push(validator);
      }
    }
  }
  if (!validators.length) {
    return null;
  }
  return (data) => {
    const errors: ValidateError[] = [];
    for (const validator of validators) {
      errors.push(...validator(data));
    }
    return errors;
  };
}

/**
 * Generate validator from schema path
 */
function schemaPathToValidator(
  schemaPath: string,
  context: RuleContext,
): Validator | null {
  const schema = loadSchema(schemaPath, context);
  if (!schema) {
    return null;
  }
  return compile(schema, schemaPath, context);
}

/**
 * Generate validator from schema object
 */
function schemaObjectToValidator(
  schema: SchemaObject | null,
  context: RuleContext,
): Validator | null {
  if (!schema) {
    return null;
  }
  const schemaPath = getCwd(context);
  return compile(schema, schemaPath, context);
}

/**
 * Report for cannot resolved schema path
 */
function reportCannotResolvedPath(schemaPath: string, context: RuleContext) {
  context.report({
    loc: { line: 1, column: 0 },
    message: `Specified schema could not be resolved. Path: "${schemaPath}"`,
  });
}

/**
 * Report for cannot resolved schema object
 */
function reportCannotResolvedObject(context: RuleContext) {
  context.report({
    loc: { line: 1, column: 0 },
    message: `Specified schema could not be resolved.`,
  });
}

export default createRule("no-invalid", {
  meta: {
    docs: {
      description: "validate object with JSON Schema.",
      categories: ["recommended"],
      default: "warn",
    },
    fixable: undefined,
    schema: [
      {
        oneOf: [
          { type: "string" },
          {
            type: "object",
            properties: {
              schemas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    fileMatch: {
                      type: "array",
                      items: { type: "string" },
                      minItems: 1,
                    },
                    schema: { type: ["object", "string"] },
                  },
                  additionalProperties: true, // It also accepts unrelated properties.
                  required: ["fileMatch", "schema"],
                },
              },
              useSchemastoreCatalog: { type: "boolean" },
            },
            additionalProperties: false,
          },
        ],
      },
    ],
    messages: {},
    type: "suggestion",
  },
  create(context, { filename }) {
    const $schemaPath = findSchemaPath(context.getSourceCode().ast);
    let validator: Validator;
    if ($schemaPath != null) {
      const v = schemaPathToValidator($schemaPath, context);
      if (!v) {
        reportCannotResolvedPath($schemaPath, context);
        return {};
      }
      validator = v;
    } else {
      const cwd = getCwd(context);
      const v = parseOption(
        context.options[0] || {},
        context,
        filename.startsWith(cwd) ? path.relative(cwd, filename) : filename,
      );
      if (!v) {
        return {};
      }
      validator = v;
    }

    let existsExports = false;
    const sourceCode = context.getSourceCode();

    /**
     * Validate JSON Schema
     */
    function validateData(
      data: unknown,
      resolveLoc: (error: ValidateError) => JSONAST.SourceLocation | null,
    ) {
      const errors = validator!(data);
      for (const error of errors) {
        const loc = resolveLoc(error);

        if (!loc) {
          // Ignore
          continue;
        }

        context.report({
          loc,
          message: error.message,
        });
      }
    }

    /**
     * Validate JS Object
     */
    function validateJSExport(
      node: ESLintExpression,
      rootRange: [number, number],
    ) {
      if (existsExports) {
        return;
      }
      existsExports = true;

      const data = analyzeJsAST(node, rootRange, context);
      if (data == null) {
        return;
      }

      validateData(data.object, (error) => {
        let target: PathData | undefined = data.pathData;
        for (const p of error.path) {
          const next = target?.children.get(p);
          target = typeof next === "symbol" ? undefined : next;
        }
        const key = target?.key;
        const range = typeof key === "function" ? key(sourceCode) : key;
        if (!range) {
          return null;
        }
        return {
          start: sourceCode.getLocFromIndex(range[0]),
          end: sourceCode.getLocFromIndex(range[1]),
        };
      });
    }

    /** Find schema path from program */
    function findSchemaPathFromJSON(node: JSONAST.JSONProgram) {
      const rootExpr = node.body[0].expression;
      if (rootExpr.type !== "JSONObjectExpression") {
        return null;
      }
      for (const prop of rootExpr.properties) {
        if (
          prop.computed ||
          (prop.key.type === "JSONIdentifier"
            ? prop.key.name
            : prop.key.value) !== "$schema"
        ) {
          continue;
        }
        return getStaticJSONValue(prop.value);
      }
      return null;
    }

    return {
      Program(node) {
        if (context.parserServices.isJSON) {
          const program = node as JSONAST.JSONProgram;
          validateData(getStaticJSONValue(program), (error) => {
            return errorDataToLoc(getJSONNodeFromPath(program, error.path));
          });
        } else if (context.parserServices.isYAML) {
          const program = node as YAML.YAMLProgram;
          validateData(getStaticYAMLValue(program), (error) => {
            return errorDataToLoc(getYAMLNodeFromPath(program, error.path));
          });
        } else if (context.parserServices.isTOML) {
          const program = node as TOML.TOMLProgram;
          validateData(getStaticTOMLValue(program), (error) => {
            return errorDataToLoc(getTOMLNodeFromPath(program, error.path));
          });
        }
      },
      ExportDefaultDeclaration(node: ESLintExportDefaultDeclaration) {
        if (
          node.declaration.type === "FunctionDeclaration" ||
          node.declaration.type === "ClassDeclaration" ||
          node.declaration.type === "VariableDeclaration"
        ) {
          return;
        }
        const defaultToken = sourceCode.getTokenBefore(node.declaration)!;
        validateJSExport(node.declaration, [
          node.range[0],
          defaultToken.range![1],
        ]);
      },
      AssignmentExpression(node: ESLintAssignmentExpression) {
        if (
          // exports = {}
          (node.left.type === "Identifier" && node.left.name === "exports") ||
          // module.exports = {}
          (node.left.type === "MemberExpression" &&
            node.left.object.type === "Identifier" &&
            node.left.object.name === "module" &&
            node.left.computed === false &&
            node.left.property.type === "Identifier" &&
            node.left.property.name === "exports")
        ) {
          validateJSExport(node.right, node.left.range);
        }
      },
    };

    /**
     * ErrorData to report location.
     */
    function errorDataToLoc(
      errorData: NodeData<JSONAST.JSONNode | YAML.YAMLNode | TOML.TOMLNode>,
    ) {
      if (errorData.key) {
        const range = errorData.key(sourceCode);
        return {
          start: sourceCode.getLocFromIndex(range[0]),
          end: sourceCode.getLocFromIndex(range[1]),
        };
      }
      return errorData.value.loc;
    }

    /** Find schema path from program */
    function findSchemaPathFromYAML(node: YAML.YAMLProgram) {
      const rootExpr = node.body[0]?.content;
      if (!rootExpr || rootExpr.type !== "YAMLMapping") {
        return null;
      }
      for (const pair of rootExpr.pairs) {
        if (
          !pair.key ||
          !pair.value ||
          pair.key.type !== "YAMLScalar" ||
          pair.key.value !== "$schema"
        ) {
          continue;
        }
        return getStaticYAMLValue(pair.value);
      }
      return null;
    }

    /** Find schema path from program */
    function findSchemaPathFromTOML(node: TOML.TOMLProgram) {
      const rootExpr = node.body[0];
      for (const body of rootExpr.body) {
        if (body.type !== "TOMLKeyValue" || body.key.keys.length !== 1) {
          continue;
        }
        const keyNode = body.key.keys[0];
        const key = keyNode.type === "TOMLBare" ? keyNode.name : keyNode.value;
        if (key !== "$schema") {
          continue;
        }
        return getStaticTOMLValue(body.value);
      }
      return null;
    }

    /** Find schema path from program */
    function findSchemaPath(node: unknown) {
      let $schema = null;
      if (context.parserServices.isJSON) {
        const program = node as JSONAST.JSONProgram;
        $schema = findSchemaPathFromJSON(program);
      } else if (context.parserServices.isYAML) {
        const program = node as YAML.YAMLProgram;
        $schema = findSchemaPathFromYAML(program);
      } else if (context.parserServices.isTOML) {
        const program = node as TOML.TOMLProgram;
        $schema = findSchemaPathFromTOML(program);
      }
      return typeof $schema === "string"
        ? $schema.startsWith(".")
          ? path.resolve(
              path.dirname(
                typeof context.getPhysicalFilename === "function"
                  ? context.getPhysicalFilename()
                  : getPhysicalFilename(context.getFilename()),
              ),
              $schema,
            )
          : $schema
        : null;
    }
  },
});

/**
 * Get cwd
 */
function getCwd(context: RuleContext) {
  if (context.getCwd) {
    return context.getCwd();
  }
  return path.resolve("");
}

/**
 * ! copied from https://github.com/mdx-js/eslint-mdx/blob/b97db2e912a416d5d40ddb78ab6c9fa1ab150c17/packages/eslint-mdx/src/helpers.ts#L28-L50
 *
 * Given a filepath, get the nearest path that is a regular file.
 * The filepath provided by eslint may be a virtual filepath rather than a file
 * on disk. This attempts to transform a virtual path into an on-disk path
 */
function getPhysicalFilename(filename: string, child?: string): string {
  try {
    if (fs.statSync(filename).isDirectory()) {
      return child || filename;
    }
  } catch (err) {
    const { code } = err as { code: string };
    // https://github.com/eslint/eslint/issues/11989
    // Additionally, it seems there is no `ENOTDIR` code on Windows...
    if (code === "ENOTDIR" || code === "ENOENT") {
      return getPhysicalFilename(path.dirname(filename), filename);
    }
  }
  return filename;
}
