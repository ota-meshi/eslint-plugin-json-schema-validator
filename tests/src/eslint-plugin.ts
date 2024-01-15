import path from "path";
import assert from "assert";
import plugin from "../../src/index";
import { Linter } from "eslint";
import semver from "semver";
import { getESLint } from "eslint-compat-utils/eslint";
// eslint-disable-next-line @typescript-eslint/naming-convention -- Class name
const ESLint = getESLint();

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

const TEST_CWD = path.join(__dirname, "../fixtures/integrations/eslint-plugin");

if (semver.lt(Linter.version, "9.0.0-0"))
  describe("Integration with eslint-plugin-json-schema-validator", () => {
    it("should lint without errors", async () => {
      const engine = new ESLint({
        cwd: TEST_CWD,
        extensions: [".js", ".json"],
        overrideConfig: {
          files: ["**/*.js", "**/*.json", "*.js", "*.json"],
          plugins: { "json-schema-validator": plugin },
        } as any,
      });
      const results = await engine.lintFiles(["test01/src"]);
      assert.strictEqual(results.length, 2);
      assert.strictEqual(
        results.reduce((s, r) => s + r.errorCount, 0),
        0,
      );
    });
  });
