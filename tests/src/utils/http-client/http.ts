import assert from "assert";
import { get, syncGet } from "../../../../src/utils/http-client";

describe("HTTP GET.", () => {
  it("Should to receive a request.", async () => {
    const res = await get(
      "https://raw.githubusercontent.com/ota-meshi/eslint-plugin-json-schema-validator/main/package.json"
    );
    assert.deepStrictEqual(
      JSON.parse(res).name,
      "eslint-plugin-json-schema-validator"
    );
  });
  it("Should to receive a request with option and sync.", () => {
    const res = syncGet(
      "https://raw.githubusercontent.com/ota-meshi/eslint-plugin-json-schema-validator/main/package.json",
      {},
      require.resolve("./get-modules/request-get")
    );
    assert.deepStrictEqual(
      JSON.parse(res).name,
      "eslint-plugin-json-schema-validator"
    );
  });
  it("Should to receive a request with a redirect.", async () => {
    const res = await get(
      "https://unpkg.com/eslint-plugin-json-schema-validator/package.json"
    );
    assert.deepStrictEqual(
      JSON.parse(res).name,
      "eslint-plugin-json-schema-validator"
    );
  });
  it("Should to receive a request with a redirect (2).", async () => {
    const res = await get(
      "https://raw.github.com/ota-meshi/eslint-plugin-json-schema-validator/main/package.json"
    );
    assert.deepStrictEqual(
      JSON.parse(res).name,
      "eslint-plugin-json-schema-validator"
    );
  });
});
