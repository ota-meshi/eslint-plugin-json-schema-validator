import assert from "assert"
import { draft7 as migrateToDraft7 } from "json-schema-migrate"
import { get, syncGet } from "../../../../src/utils/http-client"

describe("HTTP GET.", () => {
    it("Should to receive a request.", async () => {
        const res = await get("https://json.schemastore.org/eslintrc")
        assert.deepStrictEqual(
            JSON.parse(reduceSchema(res)),
            // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports -- test
            require("../../../../schemastore/json.schemastore.org/eslintrc.json"),
        )
    })
    it("Should to receive a request with option and sync.", () => {
        const res = syncGet(
            "https://json.schemastore.org/eslintrc",
            {},
            require.resolve("./get-modules/request-get"),
        )
        assert.deepStrictEqual(
            JSON.parse(reduceSchema(res)),
            // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports -- test
            require("../../../../schemastore/json.schemastore.org/eslintrc.json"),
        )
    })
})

/**
 * Reduce JSON Schema
 */
function reduceSchema(text: string) {
    const schema = JSON.parse(text)
    migrateToDraft7(schema)
    return JSON.stringify(schema, (key, value) => {
        if (key === "description" && typeof value === "string") {
            return undefined
        }
        return value
    })
}
