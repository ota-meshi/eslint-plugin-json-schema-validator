import type { AST as JSONAST } from "jsonc-eslint-parser";
import { getStaticJSONValue } from "jsonc-eslint-parser";
import type { AST as YAML } from "yaml-eslint-parser";
import { getStaticYAMLValue } from "yaml-eslint-parser";
import type { AST as TOML } from "toml-eslint-parser";
import { getStaticTOMLValue } from "toml-eslint-parser";
import { createRule } from "../utils/index.ts";
import { minimatch } from "minimatch";
import path from "path";
import type { PathData } from "../utils/ast/index.ts";
import {
  getJSONNodeFromPath,
  getYAMLNodeFromPath,
  getTOMLNodeFromPath,
  analyzeJsAST,
} from "../utils/ast/index.ts";
import { loadJson, loadSchema } from "../utils/schema.ts";
import type { RuleContext } from "../types.ts";
import type { NodeData } from "../utils/ast/common.ts";
import type { AST } from "vue-eslint-parser";
import type { ValidateError, Validator } from "../utils/validator-factory.ts";
import { compile } from "../utils/validator-factory.ts";
import type { SchemaObject } from "../utils/types.ts";
import fs from "fs";
import { toCompatCreate } from "eslint-json-compat-utils";

const CATALOG_URL = "https://www.schemastore.org/api/json/catalog.json";

/**
 * Sentinel returned when a `$schema=none` modeline is found. In
 * yaml-language-server (and the JetBrains equivalent) a `none` schema disables
 * schema validation for the file entirely, so it must not be treated as a
 * schema path.
 */
const SCHEMA_NONE = Symbol("$schema=none");

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
 * Generate validator from schema path
 */
function schemaPathToValidator(
  schemaPath: string,
  context: RuleContext,
  mostSpecificErrorsOnly: boolean,
): Validator | null {
  const schema = loadSchema(schemaPath, context);
  if (!schema) {
    return null;
  }
  return compile(schema, schemaPath, context, mostSpecificErrorsOnly);
}

/**
 * Generate validator from schema object
 */
function schemaObjectToValidator(
  schema: SchemaObject | null,
  context: RuleContext,
  mostSpecificErrorsOnly: boolean,
): Validator | null {
  if (!schema) {
    return null;
  }
  const schemaPath = context.cwd;
  return compile(schema, schemaPath, context, mostSpecificErrorsOnly);
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

type SchemaKind = "$schema" | "catalog" | "options";
const SCHEMA_KINDS: SchemaKind[] = ["$schema", "options", "catalog"];

/** Get mergeSchemas option */
function parseMergeSchemasOption(
  option: boolean | string[] | undefined,
): SchemaKind[] | null {
  return option === true
    ? SCHEMA_KINDS
    : Array.isArray(option)
      ? [...(option as SchemaKind[])].sort(
          (a, b) => SCHEMA_KINDS.indexOf(a) - SCHEMA_KINDS.indexOf(b),
        )
      : null;
}

/** Merge multiple validators into one that concatenates their errors. */
function mergeValidators(validators: Validator[]): Validator {
  return (data: unknown) =>
    validators.reduce(
      (errors, validator) => [...errors, ...validator(data)],
      [] as ValidateError[],
    );
}

/**
 * Combine schema sources into a single validator, honoring `mergeSchemas`.
 * Without `mergeSchemas`, the first non-empty source wins in the order
 * `$schema` (or a per-document directive) > `options` > `catalog`.
 */
function combineValidators(
  sources: Record<SchemaKind, Validator[] | null>,
  mergeSchemas: SchemaKind[] | null,
): Validator | null {
  if (mergeSchemas && mergeSchemas.some((kind) => sources[kind])) {
    const validators: Validator[] = [];
    for (const kind of mergeSchemas) {
      const v = sources[kind];
      if (v) validators.push(...v);
    }
    return mergeValidators(validators);
  }
  const validators = sources.$schema || sources.options || sources.catalog;
  return validators ? mergeValidators(validators) : null;
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
              mergeSchemas: {
                oneOf: [
                  { type: "boolean" },
                  {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["$schema", "catalog", "options"],
                    },
                    minItems: 2,
                    uniqueItems: true,
                  },
                ],
              },
              mostSpecificErrorsOnly: { type: "boolean" },
            },
            additionalProperties: false,
          },
        ],
      },
    ],
    messages: {},
    type: "suggestion",
  },
  create: toCompatCreate((context, { filename }) => {
    const sourceCode = context.sourceCode;
    const cwd = context.cwd;
    const mostSpecificErrorsOnly =
      context.options[0]?.mostSpecificErrorsOnly === true;
    const relativeFilename = filename.startsWith(cwd)
      ? path.relative(cwd, filename)
      : filename;

    if (sourceCode.parserServices.isYAML) {
      const validatorsCtx = createValidatorsContext(context, relativeFilename);
      const mergeSchemas = parseMergeSchemasOption(
        context.options[0]?.mergeSchemas,
      );

      /** Validate every document in a multi-document YAML program. */
      function validateYAMLProgram(program: YAML.YAMLProgram) {
        let carried: string | typeof SCHEMA_NONE | null = null;
        for (const doc of program.body) {
          const own = normalizeSchemaPath(
            findSchemaPathFromYAMLDocument(program, doc),
          );
          if (own !== null) {
            carried = own;
          }
          const directive = own !== null ? own : carried;
          // A `$schema=none` directive disables validation for this document
          // (it does not fall through to options/catalog).
          if (directive === SCHEMA_NONE) {
            continue;
          }
          const resolvedPath: string | null = directive;
          const $schemaValidators = resolvedPath
            ? schemaValidatorsFromPath(resolvedPath)
            : null;
          const docValidator = combineValidators(
            {
              $schema: $schemaValidators,
              get options() {
                return validatorsCtx.options;
              },
              get catalog() {
                return validatorsCtx.catalog;
              },
            },
            mergeSchemas,
          );
          if (!docValidator) {
            continue;
          }
          for (const error of docValidator(getStaticYAMLValue(doc))) {
            const errorData = getYAMLNodeFromPath(doc, error.path);
            if (errorData.fromMergeKey) {
              error.message += " (from merge key)";
            }
            const loc = errorDataToLoc(errorData);
            if (loc) {
              context.report({ loc, message: error.message });
            }
          }
        }
      }

      return {
        Program(node) {
          validateYAMLProgram(node as YAML.YAMLProgram);
        },
      };
    }

    const validator = createValidator(context, relativeFilename);
    if (!validator) {
      return {};
    }

    let existsExports = false;

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
      node: AST.ESLintExpression,
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

    /** Find the schema directive (modeline or root `$schema`) for one document. */
    function findSchemaPathFromYAMLDocument(
      program: YAML.YAMLProgram,
      doc: YAML.YAMLDocument,
    ): string | typeof SCHEMA_NONE | null {
      const rootExpr = doc.content;
      const headerStart = doc.range[0];
      const headerEnd = rootExpr ? rootExpr.range[0] : doc.range[1];

      // A modeline in the document's header comment takes precedence over a
      // root `$schema:` property (matching editor behavior). Accept the forms
      // used by yaml-language-server and JetBrains IDEs.
      for (const comment of program.comments) {
        if (comment.range[0] < headerStart || comment.range[0] >= headerEnd) {
          continue;
        }
        const matched =
          /^\s*(?:yaml-language-server\s*:\s*)?\$schema\s*[:=]\s*(\S+)/iu.exec(
            comment.value,
          );
        if (matched) {
          if (matched[1].toLowerCase() === "none") {
            return SCHEMA_NONE;
          }
          return matched[1];
        }
      }

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
        const value = getStaticYAMLValue(pair.value);
        return typeof value === "string" ? value : null;
      }
      return null;
    }

    return {
      Program(node) {
        if (sourceCode.parserServices.isJSON) {
          const program = node as JSONAST.JSONProgram;
          validateData(getStaticJSONValue(program), (error) => {
            return errorDataToLoc(getJSONNodeFromPath(program, error.path));
          });
        } else if (sourceCode.parserServices.isTOML) {
          const program = node as TOML.TOMLProgram;
          validateData(getStaticTOMLValue(program), (error) => {
            return errorDataToLoc(getTOMLNodeFromPath(program, error.path));
          });
        }
      },
      ExportDefaultDeclaration(node: AST.ESLintExportDefaultDeclaration) {
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
      AssignmentExpression(node: AST.ESLintAssignmentExpression) {
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

    /** Resolve a raw schema reference to an absolute path (or SCHEMA_NONE/null). */
    function normalizeSchemaPath(
      $schema: string | typeof SCHEMA_NONE | null,
    ): string | typeof SCHEMA_NONE | null {
      if ($schema === SCHEMA_NONE) {
        return SCHEMA_NONE;
      }
      if (typeof $schema !== "string") {
        return null;
      }
      return $schema.startsWith(".")
        ? path.resolve(
            path.dirname(
              typeof context.getPhysicalFilename === "function"
                ? context.getPhysicalFilename()
                : getPhysicalFilename(context.filename),
            ),
            $schema,
          )
        : $schema;
    }

    /** Build the `$schema`-source validators from an absolute schema path. */
    function schemaValidatorsFromPath($schemaPath: string): Validator[] | null {
      const validator = schemaPathToValidator(
        $schemaPath,
        context,
        mostSpecificErrorsOnly,
      );
      if (!validator) {
        reportCannotResolvedPath($schemaPath, context);
        return null;
      }
      return [validator];
    }

    /** Find schema path from program (JSON/TOML only). */
    function findSchemaPath(node: unknown) {
      let $schema: string | typeof SCHEMA_NONE | null = null;
      if (sourceCode.parserServices.isJSON) {
        $schema = findSchemaPathFromJSON(node as JSONAST.JSONProgram);
      } else if (sourceCode.parserServices.isTOML) {
        $schema = findSchemaPathFromTOML(node as TOML.TOMLProgram);
      }
      return normalizeSchemaPath($schema);
    }

    /** Validator from $schema (JSON/TOML). */
    function get$SchemaValidators(): Validator[] | null {
      const $schemaPath = findSchemaPath(sourceCode.ast);
      if (!$schemaPath || $schemaPath === SCHEMA_NONE) {
        return null;
      }
      return schemaValidatorsFromPath($schemaPath);
    }

    /** Validator from catalog.json */
    function getCatalogValidators(
      context: RuleContext,
      relativeFilename: string,
    ): Validator[] | null {
      const option = context.options[0] || {};
      const useSchemastoreCatalog = option.useSchemastoreCatalog !== false;
      if (!useSchemastoreCatalog) {
        return null;
      }

      interface ISchema {
        name?: string;
        description?: string;
        fileMatch: string[];
        url: string;
      }
      const catalog = loadJson<{ schemas: ISchema[] }>(CATALOG_URL, context);
      if (!catalog) {
        return null;
      }

      const validators: Validator[] = [];
      for (const schemaData of catalog.schemas) {
        if (!schemaData.fileMatch) {
          continue;
        }
        // Exclude schemas with patterns that match all json files.
        // https://github.com/SchemaStore/schemastore/pull/3291
        if (schemaData.fileMatch.some((s) => /^\*\.json$/u.test(s))) {
          continue;
        }
        if (!matchFile(relativeFilename, schemaData.fileMatch)) {
          continue;
        }
        const validator = schemaPathToValidator(
          schemaData.url,
          context,
          mostSpecificErrorsOnly,
        );
        if (validator) validators.push(validator);
      }
      return validators.length ? validators : null;
    }

    /** Validator from options.schemas */
    function getOptionsValidators(
      context: RuleContext,
      filename: string,
    ): Validator[] | null {
      const option = context.options[0];
      if (typeof option === "string") {
        const validator = schemaPathToValidator(
          option,
          context,
          mostSpecificErrorsOnly,
        );
        return validator ? [validator] : null;
      }

      if (typeof option !== "object" || !Array.isArray(option.schemas)) {
        return null;
      }

      const validators: Validator[] = [];
      for (const schemaData of option.schemas) {
        if (!matchFile(filename, schemaData.fileMatch)) {
          continue;
        }

        if (typeof schemaData.schema === "string") {
          const validator = schemaPathToValidator(
            schemaData.schema,
            context,
            mostSpecificErrorsOnly,
          );
          if (validator) {
            validators.push(validator);
          } else {
            reportCannotResolvedPath(schemaData.schema, context);
          }
        } else {
          const validator = schemaObjectToValidator(
            schemaData.schema,
            context,
            mostSpecificErrorsOnly,
          );
          if (validator) {
            validators.push(validator);
          } else {
            reportCannotResolvedObject(context);
          }
        }
      }
      return validators.length ? validators : null;
    }

    /** Create combined validator */
    function createValidator(context: RuleContext, filename: string) {
      const mergeSchemas = parseMergeSchemasOption(
        context.options[0]?.mergeSchemas,
      );
      const validatorsCtx = createValidatorsContext(context, filename);
      return combineValidators(validatorsCtx, mergeSchemas);
    }

    /** Creates validators context */
    function createValidatorsContext(context: RuleContext, filename: string) {
      type Cache = { validators: Validator[] | null };
      let $schema: Cache | null = null;
      let options: Cache | null = null;
      let catalog: Cache | null = null;

      /**
       * Get a validator. Returns the value of the cache if there is one.
       * If there is no cache, cache and return the value obtained from the supplier function
       */
      function get(
        cache: Cache | null,
        setCache: (c: Cache) => void,
        supplier: () => Validator[] | null,
      ) {
        if (cache) {
          return cache.validators;
        }
        const v = supplier();
        setCache({ validators: v });
        return v;
      }

      return {
        get $schema() {
          return get(
            $schema,
            (c) => ($schema = c),
            () => get$SchemaValidators(),
          );
        },
        get options() {
          return get(
            options,
            (c) => (options = c),
            () => getOptionsValidators(context, filename),
          );
        },
        get catalog() {
          return get(
            catalog,
            (c) => (catalog = c),
            () => getCatalogValidators(context, filename),
          );
        },
      };
    }
  }),
});

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
