import assert from "assert";
import plugin from "../../src";
import { version } from "../../package.json";
const expectedMeta = {
  name: "eslint-plugin-json-schema-validator",
  version,
};

describe("Test for meta object", () => {
  it("A plugin should have a meta object.", () => {
    assert.deepStrictEqual(plugin.meta, expectedMeta);
  });
});
