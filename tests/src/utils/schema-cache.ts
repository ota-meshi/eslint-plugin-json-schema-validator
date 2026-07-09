import assert from "assert";
import fs from "fs";
import os from "os";
import path from "path";
import { loadJson } from "../../../src/utils/schema.ts";
import type { RuleContext } from "../../../src/types.ts";

describe("schema cache location", () => {
  it("reads a cached schema from the configured cache.path without fetching", () => {
    const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "jsv-cache-"));
    const url = "http://cache.test.local/my-schema";
    const filePath = path.join(cacheDir, "cache.test.local", "my-schema.json");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const expected = { type: "object", title: "cached" };
    fs.writeFileSync(
      filePath,
      JSON.stringify({ data: expected, timestamp: Date.now(), v: "test" }),
    );

    const context = {
      settings: { "json-schema-validator": { cache: { path: cacheDir } } },
      cwd: process.cwd(),
      report() {
        throw new Error("should not report / fetch");
      },
    } as unknown as RuleContext;

    const result = loadJson<typeof expected>(url, context);
    assert.deepStrictEqual(result, expected);
  });
});
