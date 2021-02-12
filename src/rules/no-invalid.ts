// eslint-disable-next-line eslint-comments/disable-enable-pair -- ignore
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires -- ignore */
import type { AST as JSON } from "jsonc-eslint-parser"
import { getStaticJSONValue } from "jsonc-eslint-parser"
import type { AST as YAML } from "yaml-eslint-parser"
import { getStaticYAMLValue } from "yaml-eslint-parser"
import type { AST as TOML } from "toml-eslint-parser"
import { getStaticTOMLValue } from "toml-eslint-parser"
import { createRule } from "../utils"
import type { AdditionalPropertiesParams } from "ajv"
import Ajv from "ajv"
import type { ErrorObject } from "ajv"
import minimatch from "minimatch"
import path from "path"
import {
    getJSONNodeFromPath,
    getYAMLNodeFromPath,
    getTOMLNodeFromPath,
} from "../utils/ast"

// eslint-disable-next-line @typescript-eslint/ban-types -- ignore
type Schema = object
type Validator = (data: unknown) => ValidateError[]
type ValidateError = { message: string; path: string[] }

const ajv = new Ajv({ schemaId: "auto", allErrors: true })
ajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-04.json"))
ajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-06.json"))

/**
 * Parse data path
 */
function parseDataPath(error: ErrorObject): string[] {
    const dataPath = error.dataPath.startsWith(".")
        ? error.dataPath.slice(1)
        : error.dataPath
    const paths: string[] = []
    let index = 0
    while (index < dataPath.length) {
        const c = dataPath[index]
        if (c === "[") {
            index++
            const startIndex = index
            let endIndex = dataPath.length
            for (; index < dataPath.length; index++) {
                if (dataPath[index] === "]") {
                    endIndex = index
                    index++
                    break
                }
            }
            paths.push(dataPath.slice(startIndex, endIndex))
        } else if (c === ".") {
            index++
        } else {
            const startIndex = index
            let endIndex = dataPath.length
            for (; index < dataPath.length; index++) {
                if (dataPath[index] === ".") {
                    endIndex = index
                    index++
                    break
                }
                if (dataPath[index] === "[") {
                    endIndex = index
                    break
                }
            }
            paths.push(dataPath.slice(startIndex, endIndex))
        }
    }
    if (error.keyword === "additionalProperties") {
        paths.push(
            (error.params as AdditionalPropertiesParams).additionalProperty,
        )
    }
    return paths
}

/**
 * Get error message from schema error.
 */
function getErrorMessage(error: ErrorObject): string {
    const dataPath = error.dataPath.startsWith(".")
        ? error.dataPath.slice(1)
        : error.dataPath

    if (error.keyword === "additionalProperties") {
        const additionalProperty = (error.params as AdditionalPropertiesParams)
            .additionalProperty
        return `Unexpected property "${
            dataPath.length
                ? `${dataPath}.${additionalProperty}`
                : additionalProperty
        }"`
    }
    return `"${dataPath}" ${error.message}.`
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

        return validateSchema.errors!.map((error) => {
            return {
                message: getErrorMessage(error),
                path: parseDataPath(error),
            }
        })
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
 * Load schema data
 */
function loadSchema(schemaPath: string, getCwd: () => string) {
    if (schemaPath.startsWith("http://") || schemaPath.startsWith("https://")) {
        let jsonPath: string
        if (schemaPath.startsWith("https://json.schemastore.org/")) {
            jsonPath = schemaPath.replace(
                /^https:\/\/json\.schemastore\.org\//u,
                "",
            )
        } else {
            return null
        }
        if (jsonPath.endsWith(".json")) {
            jsonPath = jsonPath.slice(0, -5)
        }
        return require(`../../schemastore/json.schemastore.org/${jsonPath}.json`)
    }
    return require(path.resolve(getCwd(), schemaPath))
}

/**
 * Parse option
 */
function parseOption(
    option: {
        schemas?: {
            name?: string
            description?: string
            fileMatch: string[]
            schema?: Schema | string
        }[]
        useSchemastoreCatalog?: boolean
    },
    filename: string,
    getCwd: () => string,
): Validator | null {
    const validators: Validator[] = []
    for (const schemaData of option.schemas || []) {
        if (!schemaData.schema) {
            // error
        }
        if (!matchFile(filename, schemaData.fileMatch)) {
            continue
        }
        const schema =
            typeof schemaData.schema === "string"
                ? loadSchema(schemaData.schema, getCwd)
                : schemaData.schema
        if (!schema) {
            // error
        }
        validators.push(schemaToValidator(schema))
    }
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
            if (!schemaData.url.startsWith("https://json.schemastore.org/")) {
                continue
            }
            if (!matchFile(filename, schemaData.fileMatch)) {
                continue
            }
            const schema = loadSchema(schemaData.url, getCwd)
            if (!schema) {
                // error
            }
            const validator = schemaToValidator(schema)
            validators.push(validator)
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
                            required: ["fileMatch"],
                        },
                    },
                    useSchemastoreCatalog: { type: "boolean" },
                },
                additionalProperties: false,
            },
        ],
        messages: {},
        type: "suggestion",
    },
    create(context) {
        if (
            !context.parserServices.isJSON &&
            !context.parserServices.isYAML &&
            !context.parserServices.isTOML
        ) {
            return {}
        }

        const validator = parseOption(
            context.options[0] || {},
            context.getFilename(),
            getCwd,
        )

        if (!validator) {
            // ignore
            return {}
        }

        /**
         * Get cwd
         */
        function getCwd() {
            if (context.getCwd) {
                return context.getCwd()
            }
            return path.resolve("")
        }

        const sourceCode = context.getSourceCode()

        return {
            Program(node) {
                let data: unknown
                if (context.parserServices.isJSON) {
                    data = getStaticJSONValue(node as JSON.JSONProgram)
                } else if (context.parserServices.isYAML) {
                    data = getStaticYAMLValue(node as YAML.YAMLProgram)
                } else if (context.parserServices.isTOML) {
                    data = getStaticTOMLValue(node as TOML.TOMLProgram)
                } else {
                    return
                }
                const errors = validator(data)
                for (const error of errors) {
                    let errorData
                    if (context.parserServices.isJSON) {
                        errorData = getJSONNodeFromPath(
                            node as JSON.JSONProgram,
                            error.path,
                        )
                    } else if (context.parserServices.isYAML) {
                        errorData = getYAMLNodeFromPath(
                            node as YAML.YAMLProgram,
                            error.path,
                        )
                    } else if (context.parserServices.isTOML) {
                        errorData = getTOMLNodeFromPath(
                            node as TOML.TOMLProgram,
                            error.path,
                        )
                    } else {
                        continue
                    }

                    let loc: JSON.SourceLocation
                    if (errorData.key) {
                        const range = errorData.key(sourceCode)
                        loc = {
                            start: sourceCode.getLocFromIndex(range[0]),
                            end: sourceCode.getLocFromIndex(range[1]),
                        }
                    } else {
                        loc = errorData.value.loc
                    }

                    context.report({
                        loc,
                        message: error.message,
                    })
                }
            },
        }
    },
})
