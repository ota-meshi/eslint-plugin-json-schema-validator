import assert from "assert"
import { get, syncGet } from "../../../../src/utils/http-client"

describe("HTTP GET.", () => {
    it("Should to receive a request.", async () => {
        const res = await get(
            "https://www.schemastore.org/api/json/catalog.json",
        )
        assert.deepStrictEqual(
            JSON.parse(res),
            // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports -- test
            require("../../../../schemastore/www.schemastore.org/api/json/catalog.json"),
        )
    })
    it("Should to receive a request with option and sync.", () => {
        const res = syncGet(
            "https://www.schemastore.org/api/json/catalog.json",
            {},
            require.resolve("./get-modules/request-get"),
        )
        assert.deepStrictEqual(
            JSON.parse(res),
            // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports -- test
            require("../../../../schemastore/www.schemastore.org/api/json/catalog.json"),
        )
    })
})
