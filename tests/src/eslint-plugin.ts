import path from "path"
import assert from "assert"
import { ESLint } from "./eslint-compat"
import plugin from "../../src/index"

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

const TEST_CWD = path.join(__dirname, "../fixtures/integrations/eslint-plugin")

describe("Integration with eslint-plugin-json-schema-validator", () => {
    it("should lint without errors", async () => {
        const engine = new ESLint({
            cwd: TEST_CWD,
            extensions: [".js", ".json"],
            plugins: { "eslint-plugin-json-schema-validator": plugin },
        })
        const results = await engine.lintFiles(["test01/src"])
        assert.strictEqual(results.length, 2)
        assert.strictEqual(
            results.reduce((s, r) => s + r.errorCount, 0),
            0,
        )
    })
})
