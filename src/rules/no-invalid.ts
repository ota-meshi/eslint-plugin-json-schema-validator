// eslint-disable-next-line eslint-comments/disable-enable-pair -- ignore
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires -- ignore */
import type { AST as JSONAST } from "jsonc-eslint-parser"
import { getStaticJSONValue } from "jsonc-eslint-parser"
import type { AST as YAML } from "yaml-eslint-parser"
import { getStaticYAMLValue } from "yaml-eslint-parser"
import type { AST as TOML } from "toml-eslint-parser"
import { getStaticTOMLValue } from "toml-eslint-parser"
import { createRule } from "../utils"
import Ajv from "../utils/ajv"
import type { DefinedError, ErrorObject } from "ajv"
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

// eslint-disable-next-line @typescript-eslint/ban-types -- ignore
type Schema = object
type Validator = (data: unknown) => ValidateError[]
type ValidateError = { message: string; path: string[] }

const ajv = new Ajv({
    // schemaId: "auto",
    allErrors: true,
    verbose: true,
    validateSchema: false,
    // missingRefs: "ignore",
    // extendRefs: "ignore",
    logger: false,
    strict: false,
})
// ajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-04.json"))
ajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-06.json"))

/** @see https://github.com/ajv-validator/ajv/blob/e816cd24b60068b3937dc7143beeab3fe6612391/lib/compile/util.ts#L59 */
function unescapeFragment(str: string): string {
    return unescapeJsonPointer(decodeURIComponent(str))
}

/** @see https://github.com/ajv-validator/ajv/blob/e816cd24b60068b3937dc7143beeab3fe6612391/lib/compile/util.ts#L72 */
function unescapeJsonPointer(str: string): string {
    return str.replace(/~1/g, "/").replace(/~0/g, "~")
}

/* eslint-disable complexity -- X( */
/**
 * Schema error to validate error.
 */
function errorToValidateError(
    /* eslint-enable complexity -- X( */
    errorObject: ErrorObject,
): ValidateError {
    const error: DefinedError = errorObject as DefinedError

    const dataPath = error.dataPath.startsWith("/")
        ? error.dataPath.slice(1)
        : error.dataPath
    // console.log(dataPath)
    const path: string[] = dataPath
        ? dataPath.split("/").map(unescapeFragment)
        : []

    if (error.keyword === "additionalProperties") {
        path.push(error.params.additionalProperty)
        return {
            message: `Unexpected property "${joinPath(path)}"`,
            path,
        }
    }
    if (error.keyword === "propertyNames") {
        return {
            message: `"${joinPath(path)}" property name ${JSON.stringify(
                error.params.propertyName,
            )} is invalid.`,
            path: [...path, error.params.propertyName],
        }
    }
    if (error.keyword === "uniqueItems") {
        const baseMessage = `should NOT have duplicate items (items ## ${error.params.j} and ${error.params.i} are identical)`
        return {
            message: `"${joinPath(path)}" ${baseMessage}.`,
            path: [...path, String(error.params.i)],
        }
    }
    let baseMessage: string
    if (error.keyword === "enum") {
        baseMessage = `should be equal to ${joinEnums(
            error.params.allowedValues,
        )}`
    } else if (error.keyword === "const") {
        baseMessage = `should be equal to ${JSON.stringify(
            error.params.allowedValue,
        )}`
    } else if (error.keyword === "not") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
        const schema: any = error.schema!
        const schemaKeys = Object.keys(schema)
        if (schemaKeys.length === 1 && schemaKeys[0] === "type") {
            // { type: "foo" }
            baseMessage = `should NOT be ${schema.type}`
        } else if (schemaKeys.length === 1 && schemaKeys[0] === "enum") {
            // { enum: ["foo"] }
            baseMessage = `should NOT be equal to ${joinEnums(schema.enum)}`
        } else {
            baseMessage = `should NOT be valid of define schema`
        }
    } else if (
        error.keyword === "type" || // should be X
        error.keyword === "oneOf" || // should match exactly one schema in oneOf
        error.keyword === "anyOf" || // should match some schema in anyOf
        // array
        error.keyword === "minItems" || // should NOT have fewer than X items
        error.keyword === "maxItems" || // should NOT have more than X items
        error.keyword === "additionalItems" || // should NOT have more than X items
        error.keyword === "contains" || // should contain at least 1 valid item(s)
        // object
        error.keyword === "required" || // should have required property 'X'
        error.keyword === "maxProperties" || // should NOT have more than X items
        error.keyword === "minProperties" || // should NOT have fewer than X items
        error.keyword === "dependencies" || // should have property X when property Y is present
        // string
        error.keyword === "pattern" || // should match pattern "X"
        error.keyword === "maxLength" || // should NOT have more than X characters
        error.keyword === "minLength" || // should NOT have fewer than X characters
        error.keyword === "format" ||
        // number
        error.keyword === "maximum" || // should be <= X
        error.keyword === "minimum" || // should be >= X
        error.keyword === "exclusiveMaximum" || // should be < X
        error.keyword === "exclusiveMinimum" || // should be > X
        error.keyword === "multipleOf" || // should be multiple of X
        // other
        error.keyword === "if" // should match "X" schema
    ) {
        // Use error.message
        baseMessage = error.message!
    } else {
        // Others
        baseMessage = error.message!
    }

    if (error.propertyName) {
        return {
            message: `"${joinPath(path)}" property name ${JSON.stringify(
                error.propertyName,
            )} ${baseMessage}.`,
            path: [...path, error.propertyName],
        }
    }
    return {
        message: `"${joinPath(path)}" ${baseMessage}.`,
        path,
    }

    /** Join enums */
    function joinEnums(enums: string[]) {
        const list = enums.map((v: string) => JSON.stringify(v))
        const last = list.pop()
        if (list.length) {
            return `${list.join(", ")} or ${last}`
        }
        return last
    }

    /** Join paths */
    function joinPath(paths: string[]) {
        let result = ""
        for (const p of paths) {
            if (/^[a-z_$][\w$]*$/iu.test(p)) {
                if (result) {
                    result += `.${p}`
                } else {
                    result = p
                }
            } else {
                result += `[${/^\d+$/iu.test(p) ? p : JSON.stringify(p)}]`
            }
        }
        return result
    }
}

/**
 * Build validator
 */
function schemaToValidator(schema: Schema): Validator {
    const validateSchema = ajv.compile(schema)
    return (data) => {
        if (validateSchema(data)) {
            return []
        }

        return validateSchema.errors!.map(errorToValidateError)
    }
}

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
                  schema: Schema | string
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
        validators.push(schemaToValidator(schema))
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
                const validator = schemaToValidator(schema)
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
        function validateJSExport(node: ESLintExpression) {
            if (existsExports) {
                return
            }
            existsExports = true

            const data = analyzeJsAST(node, context)
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
                validateJSExport(node.declaration)
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
                    validateJSExport(node.right)
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
