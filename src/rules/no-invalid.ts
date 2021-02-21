// eslint-disable-next-line eslint-comments/disable-enable-pair -- ignore
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires -- ignore */
import type { AST as JSONAST } from "jsonc-eslint-parser"
import { getStaticJSONValue } from "jsonc-eslint-parser"
import type { AST as YAML } from "yaml-eslint-parser"
import { getStaticYAMLValue } from "yaml-eslint-parser"
import type { AST as TOML } from "toml-eslint-parser"
import { getStaticTOMLValue } from "toml-eslint-parser"
import { createRule } from "../utils"
import type { SchemaObject } from "ajv"
import minimatch from "minimatch"
import path from "path"
import type { PathData } from "../utils/ast"
import {
    getJSONNodeFromPath,
    getYAMLNodeFromPath,
    getTOMLNodeFromPath,
    analyzeJsAST,
} from "../utils/ast"
import { loadSchema } from "../utils/schema"
import type { RuleContext } from "../types"
import type { NodeData } from "../utils/ast/common"
import type {
    ESLintAssignmentExpression,
    ESLintExportDefaultDeclaration,
    ESLintExpression,
} from "vue-eslint-parser/ast"
import type { ValidateError, Validator } from "../utils/validator-factory"
import { compile } from "../utils/validator-factory"

/**
 * Checks if match file
 */
function matchFile(filename: string, fileMatch: string[]) {
    return (
        fileMatch.includes(path.basename(filename)) ||
        fileMatch.some((fm) => minimatch(filename, fm))
    )
}

/**
 * Parse option
 */
function parseOption(
    option:
        | {
              schemas?: {
                  name?: string
                  description?: string
                  fileMatch: string[]
                  schema: SchemaObject | string
              }[]
              useSchemastoreCatalog?: boolean
          }
        | string,
    context: RuleContext,
    filename: string,
): Validator | null {
    if (typeof option === "string") {
        return parseOption(
            {
                schemas: [
                    { fileMatch: [path.basename(filename)], schema: option },
                ],
                useSchemastoreCatalog: false,
            },
            context,
            filename,
        )
    }

    const validators: Validator[] = []

    for (const schemaData of option.schemas || []) {
        if (!matchFile(filename, schemaData.fileMatch)) {
            continue
        }
        const schema =
            typeof schemaData.schema === "string"
                ? loadSchema(schemaData.schema, context)
                : schemaData.schema
        if (!schema) {
            context.report({
                loc: { line: 1, column: 0 },
                message: `Specified schema could not be resolved.${
                    typeof schemaData.schema === "string"
                        ? ` Path: "${schemaData.schema}"`
                        : ""
                }`,
            })
            continue
        }
        const schemaPath =
            typeof schemaData.schema === "string"
                ? schemaData.schema
                : getCwd(context)
        validators.push(compile(schema, schemaPath, context))
    }
    if (!validators.length) {
        // If it matches the user's definition, don't use `catalog.json`.
        if (option.useSchemastoreCatalog !== false) {
            const catalog = require("../../schemastore/www.schemastore.org/api/json/catalog.json")
            const schemas: {
                name?: string
                description?: string
                fileMatch: string[]
                url: string
            }[] = catalog.schemas

            for (const schemaData of schemas) {
                if (!schemaData.fileMatch) {
                    continue
                }
                if (!matchFile(filename, schemaData.fileMatch)) {
                    continue
                }
                const schema = loadSchema(schemaData.url, context)
                if (!schema) {
                    continue
                }
                const validator = compile(schema, schemaData.url, context)
                validators.push(validator)
            }
        }
    }
    if (!validators.length) {
        return null
    }
    return (data) => {
        const errors: ValidateError[] = []
        for (const validator of validators) {
            errors.push(...validator(data))
        }
        return errors
    }
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
        const cwd = getCwd(context)
        const validator = parseOption(
            context.options[0] || {},
            context,
            filename.startsWith(cwd) ? filename.slice(cwd.length) : filename,
        )

        if (!validator) {
            // ignore
            return {}
        }

        let existsExports = false
        const sourceCode = context.getSourceCode()

        /**
         * Validate JSON Schema
         */
        function validateData(
            data: unknown,
            resolveLoc: (error: ValidateError) => JSONAST.SourceLocation | null,
        ) {
            const errors = validator!(data)
            for (const error of errors) {
                const loc = resolveLoc(error)

                if (!loc) {
                    // Ignore
                    continue
                }

                context.report({
                    loc,
                    message: error.message,
                })
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
                return
            }
            existsExports = true

            const data = analyzeJsAST(node, rootRange, context)
            if (data == null) {
                return
            }

            validateData(data.object, (error) => {
                let target: PathData | undefined = data.pathData
                for (const p of error.path) {
                    const next = target?.children.get(p)
                    target = typeof next === "symbol" ? undefined : next
                }
                const key = target?.key
                const range = typeof key === "function" ? key(sourceCode) : key
                if (!range) {
                    return null
                }
                return {
                    start: sourceCode.getLocFromIndex(range[0]),
                    end: sourceCode.getLocFromIndex(range[1]),
                }
            })
        }

        return {
            Program(node) {
                if (context.parserServices.isJSON) {
                    const program = node as JSONAST.JSONProgram
                    validateData(getStaticJSONValue(program), (error) => {
                        return errorDataToLoc(
                            getJSONNodeFromPath(program, error.path),
                        )
                    })
                } else if (context.parserServices.isYAML) {
                    const program = node as YAML.YAMLProgram
                    validateData(getStaticYAMLValue(program), (error) => {
                        return errorDataToLoc(
                            getYAMLNodeFromPath(program, error.path),
                        )
                    })
                } else if (context.parserServices.isTOML) {
                    const program = node as TOML.TOMLProgram
                    validateData(getStaticTOMLValue(program), (error) => {
                        return errorDataToLoc(
                            getTOMLNodeFromPath(program, error.path),
                        )
                    })
                }
            },
            ExportDefaultDeclaration(node: ESLintExportDefaultDeclaration) {
                if (
                    node.declaration.type === "FunctionDeclaration" ||
                    node.declaration.type === "ClassDeclaration" ||
                    node.declaration.type === "VariableDeclaration"
                ) {
                    return
                }
                const defaultToken = sourceCode.getTokenBefore(
                    node.declaration,
                )!
                validateJSExport(node.declaration, [
                    node.range[0],
                    defaultToken.range![1],
                ])
            },
            AssignmentExpression(node: ESLintAssignmentExpression) {
                if (
                    // exports = {}
                    (node.left.type === "Identifier" &&
                        node.left.name === "exports") ||
                    // module.exports = {}
                    (node.left.type === "MemberExpression" &&
                        node.left.object.type === "Identifier" &&
                        node.left.object.name === "module" &&
                        node.left.computed === false &&
                        node.left.property.type === "Identifier" &&
                        node.left.property.name === "exports")
                ) {
                    validateJSExport(node.right, node.left.range)
                }
            },
        }

        /**
         * ErrorData to report location.
         */
        function errorDataToLoc(
            errorData: NodeData<
                JSONAST.JSONNode | YAML.YAMLNode | TOML.TOMLNode
            >,
        ) {
            if (errorData.key) {
                const range = errorData.key(sourceCode)
                return {
                    start: sourceCode.getLocFromIndex(range[0]),
                    end: sourceCode.getLocFromIndex(range[1]),
                }
            }
            return errorData.value.loc
        }
    },
})

/**
 * Get cwd
 */
function getCwd(context: RuleContext) {
    if (context.getCwd) {
        return context.getCwd()
    }
    return path.resolve("")
}
