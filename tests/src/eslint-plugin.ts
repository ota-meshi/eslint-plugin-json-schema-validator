import path from "path";
import assert from "assert";
import plugin from "../../src/index.ts";
import { getESLint } from "eslint-compat-utils/eslint";

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

const TEST_FIXTURES_ROOT = path.join(
  import.meta.dirname,
  "../fixtures/integrations/eslint-plugin",
);

describe("Integration with eslint-plugin-json-schema-validator", () => {
  it("should lint without errors with flat-config using recommended", async () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Class name
    const ESLint = getESLint();
    const engine = new ESLint({
      cwd: path.join(TEST_FIXTURES_ROOT, "flat-config-test01"),
      overrideConfigFile: true,
      overrideConfig: plugin.configs.recommended,
    });
    const results = await engine.lintFiles(["src"]);
    assert.strictEqual(results.length, 2);
    assert.strictEqual(
      results.reduce((s, r) => s + r.errorCount, 0),
      0,
    );
  });
  it("should lint without errors with flat-config using flat/recommended (backward compatibility)", async () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Class name
    const ESLint = getESLint();
    const engine = new ESLint({
      cwd: path.join(TEST_FIXTURES_ROOT, "flat-config-test01"),
      overrideConfigFile: true,
      overrideConfig: plugin.configs["flat/recommended"],
    });
    const results = await engine.lintFiles(["src"]);
    assert.strictEqual(results.length, 2);
    assert.strictEqual(
      results.reduce((s, r) => s + r.errorCount, 0),
      0,
    );
  });
});
