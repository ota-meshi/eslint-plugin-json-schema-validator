import type Ajv from "ajv"
import { _, str } from "ajv"
import type { CodeKeywordDefinition } from "ajv"

const ops = {
    GT: _`>`,
    GTE: _`>=`,
    LT: _`<`,
    LTE: _`<=`,
}

/**
 * Apply custom keywords ("maximum", "minimum", "exclusiveMaximum", "exclusiveMinimum")
 * Change the limitation keywords to handle the deprecated draft v4 "exclusiveMaximum" and "exclusiveMinimum".
 *
 * This is based on following link.
 * @see https://github.com/ajv-validator/ajv/blob/fcbca58748bbfd9e75fb2aba8c21a621a1d7be2a/lib/vocabularies/validation/limitNumber.ts#L1
 */
export function applyLimitNumberKeywords(ajv: Ajv): void {
    const baseLimitNumbers = {
        maximum: ajv.getKeyword("maximum"),
        minimum: ajv.getKeyword("minimum"),
        exclusiveMaximum: ajv.getKeyword("exclusiveMaximum"),
        exclusiveMinimum: ajv.getKeyword("exclusiveMinimum"),
    } as Record<
        string,
        CodeKeywordDefinition & {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
            error: { message: any; params: any }
        }
    >

    const minMax: CodeKeywordDefinition = {
        keyword: ["maximum", "minimum"],
        type: "number",
        schemaType: "number",
        $data: true,
        error: {
            message: (cxt) => {
                const { keyword, schemaCode, parentSchema } = cxt
                if (
                    keyword === "maximum" &&
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
                    (parentSchema as any).exclusiveMaximum === true
                ) {
                    return str`should be < ${schemaCode}`
                }
                if (
                    keyword === "minimum" &&
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
                    (parentSchema as any).exclusiveMinimum === true
                ) {
                    return str`should be > ${schemaCode}`
                }
                return baseLimitNumbers[cxt.keyword].error.message(cxt)
            },
            params: (cxt) => {
                const { keyword, schemaCode, parentSchema } = cxt
                if (
                    keyword === "maximum" &&
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
                    (parentSchema as any).exclusiveMaximum === true
                ) {
                    return _`{comparison: "<", limit: ${schemaCode}}`
                }
                if (
                    keyword === "minimum" &&
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
                    (parentSchema as any).exclusiveMinimum === true
                ) {
                    return _`{comparison: ">", limit: ${schemaCode}}`
                }
                return baseLimitNumbers[cxt.keyword].error.params(cxt)
            },
        },
        code(cxt) {
            const { keyword, data, schemaCode, parentSchema } = cxt
            if (
                keyword === "maximum" &&
                parentSchema.exclusiveMaximum === true
            ) {
                cxt.fail$data(
                    _`${data} ${ops.GTE} ${schemaCode} || isNaN(${data})`,
                )
                return
            }
            if (
                keyword === "minimum" &&
                parentSchema.exclusiveMinimum === true
            ) {
                cxt.fail$data(
                    _`${data} ${ops.LTE} ${schemaCode} || isNaN(${data})`,
                )
                return
            }
            baseLimitNumbers[keyword].code(cxt)
        },
    }

    const exclusiveMinMax: CodeKeywordDefinition = {
        keyword: ["exclusiveMaximum", "exclusiveMinimum"],
        type: "number",
        schemaType: ["number", "boolean"],
        $data: true,
        error: {
            message: (cxt) => baseLimitNumbers[cxt.keyword].error.message(cxt),
            params: (cxt) => baseLimitNumbers[cxt.keyword].error.params(cxt),
        },
        code(cxt) {
            const { keyword, schemaValue } = cxt
            if (typeof schemaValue === "boolean") {
                return
            }
            baseLimitNumbers[keyword].code(cxt)
        },
    }

    ajv.removeKeyword("maximum")
    ajv.removeKeyword("minimum")
    ajv.removeKeyword("exclusiveMaximum")
    ajv.removeKeyword("exclusiveMinimum")
    ajv.addKeyword(minMax)
    ajv.addKeyword(exclusiveMinMax)
}
