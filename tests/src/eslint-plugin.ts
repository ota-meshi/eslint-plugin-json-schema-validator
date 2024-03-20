import path from "path";
import assert from "assert";
import plugin from "../../src/index";
import semver from "semver";
import { getLegacyESLint, getESLint } from "eslint-compat-utils/eslint";

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

const TEST_FIXTURES_ROOT = path.join(
  __dirname,
  "../fixtures/integrations/eslint-plugin",
);

describe("Integration with eslint-plugin-json-schema-validator", () => {
  it("should lint without errors with legacy-config", async () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Class name
    const ESLint = getLegacyESLint();
    const engine = new ESLint({
      cwd: path.join(TEST_FIXTURES_ROOT, "legacy-config-test01"),
      extensions: [".js", ".json"],
      plugins: { "json-schema-validator": plugin as any },
    });
    const results = await engine.lintFiles(["src"]);
    assert.strictEqual(results.length, 2);
    assert.strictEqual(
      results.reduce((s, r) => s + r.errorCount, 0),
      0,
    );
  });
  it("should lint without errors with flat-config", async () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Class name
    const ESLint = getESLint();
    const engine = new ESLint({
      cwd: path.join(TEST_FIXTURES_ROOT, "flat-config-test01"),
      // @ts-expect-error -- typing bug
      overrideConfigFile: true,
      // @ts-expect-error -- typing bug
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
