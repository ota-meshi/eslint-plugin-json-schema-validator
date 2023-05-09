import assert from "assert";
import plugin from "../../src";
import { version } from "../../package.json";
const expectedMeta = {
  name: "eslint-plugin-json-schema-validator",
  version,
};

describe("Test for meta object", () => {
  it("A plugin should have a meta object.", () => {
    assert.strictEqual(plugin.meta.name, expectedMeta.name);
    assert.strictEqual(plugin.meta.version, expectedMeta.version);
  });
});
