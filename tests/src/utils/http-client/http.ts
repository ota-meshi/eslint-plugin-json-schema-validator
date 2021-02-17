import assert from "assert"
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
    return JSON.stringify(JSON.parse(text), (key, value) => {
        if (key === "description" && typeof value === "string") {
            return undefined
        }
        return value
    })
}
