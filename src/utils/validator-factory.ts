import type {
    DefinedError,
    ErrorObject,
    SchemaObject,
    ValidateFunction,
} from "ajv"
import { URL } from "url"
import type { RuleContext } from "../types"
import Ajv from "./ajv"
import { applyLimitNumberKeywords } from "./ajv-custom/limit-number"
import { loadSchema } from "./schema"

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
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports -- ignore
ajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-06.json"))

// Avoid exceptions due to incorrect schema.
// See https://github.com/ajv-validator/ajv/blob/fcbca58748bbfd9e75fb2aba8c21a621a1d7be2a/lib/vocabularies/core/id.ts#L6
ajv.removeKeyword("id")

applyLimitNumberKeywords(ajv)

/** @see https://github.com/ajv-validator/ajv/blob/e816cd24b60068b3937dc7143beeab3fe6612391/lib/compile/util.ts#L59 */
function unescapeFragment(str: string): string {
    return unescapeJsonPointer(decodeURIComponent(str))
}

/** @see https://github.com/ajv-validator/ajv/blob/e816cd24b60068b3937dc7143beeab3fe6612391/lib/compile/util.ts#L72 */
function unescapeJsonPointer(str: string): string {
    return str.replace(/~1/g, "/").replace(/~0/g, "~")
}

export type Validator = (data: unknown) => ValidateError[]
export type ValidateError = { message: string; path: string[] }

/**
 * Compile JSON Schema
 */
export function compile(
    schema: SchemaObject,
    schemaPath: string,
    context: RuleContext,
): Validator {
    return schemaToValidator(schema, schemaPath, context)
}

/**
 * Build validator
 */
function schemaToValidator(
    schema: SchemaObject,
    schemaPath: string,
    context: RuleContext,
): Validator {
    let validateSchema: ValidateFunction
    // eslint-disable-next-line no-constant-condition -- ignore
    while (true) {
        try {
            validateSchema = ajv.compile(schema)
        } catch (e) {
            if (resolveError(e, schemaPath, schema, context)) {
                continue
            }
            throw e
        }
        break
    }

    return (data) => {
        if (validateSchema(data)) {
            return []
        }

        return validateSchema.errors!.map(errorToValidateError)
    }
}

/**
 * Resolve Schema Error
 */
function resolveError(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
    error: any,
    baseSchemaPath: string,
    baseSchema: SchemaObject,
    context: RuleContext,
): boolean {
    if (error.missingRef) {
        let schemaPath = ""
        let schemaId = ""
        if (
            error.missingRef.startsWith("http://") ||
            error.missingRef.startsWith("https://")
        ) {
            const uri = new URL(error.missingRef)
            uri.hash = ""
            schemaPath = uri.toString()
            schemaId = schemaPath
        } else {
            const ref = error.missingRef
            const baseUri = new URL(baseSchema.$id || baseSchemaPath)
            baseUri.hash = ""
            const slashIndex = baseUri.pathname.lastIndexOf("/")
            if (slashIndex >= 0) {
                baseUri.pathname = baseUri.pathname.slice(0, slashIndex + 1)
            }
            const uri = new URL(`${baseUri.toString()}${ref}`)
            uri.hash = ""
            schemaPath = uri.toString()
            schemaId = ref.split("#")[0]
        }
        if (schemaPath) {
            const refSchema = loadSchema(schemaPath, context)

            if (refSchema) {
                // eslint-disable-next-line no-constant-condition -- ignore
                while (true) {
                    try {
                        ajv.addSchema(refSchema, schemaId)
                    } catch (e) {
                        if (resolveError(e, schemaPath, refSchema, context)) {
                            continue
                        }
                        throw e
                    }
                    break
                }
                return true
            }
        }
    }

    return false
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
            message: `Unexpected property ${joinPath(path)}`,
            path,
        }
    }
    if (error.keyword === "propertyNames") {
        return {
            message: `${joinPath(path)} property name ${JSON.stringify(
                error.params.propertyName,
            )} is invalid.`,
            path: [...path, error.params.propertyName],
        }
    }
    if (error.keyword === "uniqueItems") {
        const baseMessage = `should NOT have duplicate items (items ## ${error.params.j} and ${error.params.i} are identical)`
        return {
            message: `${joinPath(path)} ${baseMessage}.`,
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
            message: `${joinPath(path)} property name ${JSON.stringify(
                error.propertyName,
            )} ${baseMessage}.`,
            path: [...path, error.propertyName],
        }
    }
    return {
        message: `${joinPath(path)} ${baseMessage}.`,
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
        if (!paths.length) {
            return "Root"
        }
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
        return `"${result}"`
    }
}
