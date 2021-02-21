import { URL } from "url"
import type { RuleContext } from "../../../types"
import { loadSchema } from "../../schema"
import type {
    ValidationError,
    Validate,
    ValidatorOptions,
} from "@exodus/schemasafe"
import { validator as buildValidator } from "@exodus/schemasafe"
import type { SchemaObject } from "../../types"

const KNOWN_KEYWORDS = [
    // generic
    "type",
    "required",
    // constant values
    "enum",
    "const",
    // logical
    "not",
    "allOf",
    "anyOf",
    "oneOf",
    "if",
    "then",
    "else",
    // numbers
    "maximum",
    "minimum",
    "exclusiveMaximum",
    "exclusiveMinimum",
    "multipleOf",
    "divisibleBy",
    // arrays
    "items",
    "maxItems",
    "minItems",
    "additionalItems",
    // arrays, complex
    "contains",
    "minContains",
    "maxContains",
    "uniqueItems",
    // strings
    "maxLength",
    "minLength",
    "format",
    "pattern",
    // strings content
    "contentEncoding",
    "contentMediaType",
    "contentSchema",
    // objects
    "properties",
    "maxProperties",
    "minProperties",
    "additionalProperties",
    "patternProperties",
    "propertyNames",
    "dependencies",
    "dependentRequired",
    "dependentSchemas",
    // see-through
    "unevaluatedProperties",
    "unevaluatedItems",
    "discriminator",
] as const

/** @see https://github.com/ExodusMovement/schemasafe/blob/3f4dc5f9f8e92fca105d140296cb1c13eb17df0d/src/pointer.js#L3 */
function untilde(string: string) {
    if (!string.includes("~")) return string
    return string.replace(/~[01]/g, (match) => {
        switch (match) {
            case "~1":
                return "/"
            case "~0":
                return "~"
            default:
                break
        }
        /* c8 ignore next */
        throw new Error("Unreachable")
    })
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
    let validateSchema: Validate
    const options: ValidatorOptions = { schemas: {} }
    // eslint-disable-next-line no-constant-condition -- ignore
    while (true) {
        try {
            validateSchema = buildValidator(schema, {
                includeErrors: true,
                allErrors: true,
                extraFormats: true,
                weakFormats: true,
                allowUnusedKeywords: true,
                allowUnreachable: true,
                ...options,
            })
        } catch (error) {
            if (resolveError(error, schemaPath, schema, context, options)) {
                continue
            }
            throw error
        }
        break
    }

    return (data) => {
        if (validateSchema(data)) {
            return []
        }

        return validateSchema.errors!.map((error) =>
            errorToValidateError(error, schema),
        )
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
    options: ValidatorOptions,
): boolean {
    const missingRef = /failed to resolve \$ref: "([^"]+?)"/u.exec(
        error.message,
    )
    if (missingRef) {
        if (missingRef[1].startsWith("#")) {
            return false
        }
        let schemaPath = ""
        let schemaId = ""
        if (
            missingRef[1].startsWith("http://") ||
            missingRef[1].startsWith("https://")
        ) {
            const uri = new URL(missingRef[1])
            uri.hash = ""
            schemaPath = uri.toString()
            schemaId = schemaPath
        } else {
            const ref = missingRef[1]
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
            if (options.schemas[schemaId]) {
                return false
            }
            const refSchema = loadSchema(schemaPath, context)

            if (refSchema) {
                options.schemas[schemaId] = refSchema
                return true
            }
        }
    }

    return false
}

/** Gets path data */
function get(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any
    obj: any,
    props: string[],
) {
    let curr = obj
    for (const prop of props) {
        if (curr == null) {
            return undefined
        }
        curr = curr[prop]
    }
    return curr
}

type Keyword = typeof KNOWN_KEYWORDS[number]
type MessageBuilder = (args: {
    path: string[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any
    def: any
    schema: SchemaObject
    keywordPath: string[]
}) => string
type MessageBuilders = { [key in Keyword]?: MessageBuilder }

const MESSAGE_BUILDERS: MessageBuilders = {
    type({ def }) {
        return `should be ${def}`
    },
    enum({ def }) {
        return `should be equal to ${joinEnums(def)}`
    },
    const({ def }) {
        return `should be equal to ${JSON.stringify(def)}`
    },
    anyOf() {
        return `should match some schema in anyOf`
    },
    oneOf() {
        return `should match some schema in oneOf`
    },
    // array
    additionalItems({ schema, keywordPath }) {
        const arraySchema = get(schema, keywordPath.slice(0, -1))
        return `should NOT have more than ${arraySchema.items.length} items`
    },
    contains() {
        return `should  contain at least 1 valid item(s)`
    },
    maxItems({ def }) {
        return `should NOT have more than ${def} items`
    },
    minItems({ def }) {
        return `should NOT have fewer than ${def} items`
    },
    uniqueItems({ path }) {
        const i = 1,
            j = 2 // TODO
        path.push(String(j))
        return `should NOT have duplicate items (items ## ${j} and ${i} are identical)`
    },
    // object
    required({ path }) {
        return `should have required property ${joinPath([path.pop()!])}`
    },
    additionalProperties({ path }) {
        return `Unexpected property ${joinPath(path)}`
    },
    maxProperties({ def }) {
        return `should NOT have more than ${def} items`
    },
    minProperties({ def }) {
        return `should NOT have fewer than ${def} items`
    },
    // string
    pattern({ def }) {
        return `should match pattern ${JSON.stringify(def)}`
    },
    // number
    maximum({ def }) {
        return `should be <= ${def}`
    },
    minimum({ def }) {
        return `should be >= ${def}`
    },
    exclusiveMaximum({ def }) {
        return `should be < ${def}`
    },
    exclusiveMinimum({ def }) {
        return `should be > ${def}`
    },
    multipleOf({ def }) {
        return `should be multiple of ${def}`
    },
    not({ def }) {
        const schema = def
        const schemaKeys = Object.keys(schema)
        if (schemaKeys.length === 1 && schemaKeys[0] === "type") {
            // { type: "foo" }
            return `should NOT be ${schema.type}`
        } else if (schemaKeys.length === 1 && schemaKeys[0] === "enum") {
            // { enum: ["foo"] }
            return `should NOT be equal to ${joinEnums(schema.enum)}`
        }
        return `should NOT be valid of define schema`
    },
}

/**
 * Schema error to validate error.
 */
function errorToValidateError(
    error: ValidationError,
    schema: SchemaObject,
): ValidateError {
    // console.log(dataPath)
    const path: string[] = error.instanceLocation.split("/").map(untilde)
    if (!["", "#"].includes(path.shift()!))
        throw new Error("Invalid JSON pointer")
    const keywordPath: string[] = error.keywordLocation.split("/").map(untilde)
    if (!["", "#"].includes(keywordPath.shift()!))
        throw new Error("Invalid JSON pointer")

    const keyword = keywordPath[keywordPath.length - 1] as Keyword
    const def = get(schema, keywordPath)

    const messageBuilder = MESSAGE_BUILDERS[keyword]
    const baseMessage = messageBuilder
        ? messageBuilder({ path, def, schema, keywordPath })
        : "should match schema"

    if (keyword === "additionalProperties") {
        return {
            message: baseMessage,
            path,
        }
    }
    return {
        message: `${joinPath(path)} ${baseMessage}.`,
        path,
    }
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

/** Join enums */
function joinEnums(enums: string[]) {
    const list = enums.map((v: string) => JSON.stringify(v))
    const last = list.pop()
    if (list.length) {
        return `${list.join(", ")} or ${last}`
    }
    return last
}
