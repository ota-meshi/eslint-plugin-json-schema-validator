import assert from "assert";
import path from "path";
import {
  DEFAULT_CACHE_DIR,
  DEFAULT_TTL,
  parseTtl,
  resolveCacheDir,
  getCacheSettings,
} from "../../../src/utils/cache-settings.ts";
import type { RuleContext } from "../../../src/types.ts";

describe("parseTtl", () => {
  it("returns the default TTL when unset", () => {
    assert.strictEqual(parseTtl(undefined), DEFAULT_TTL);
  });
  it("passes a non-negative number through as milliseconds", () => {
    assert.strictEqual(parseTtl(0), 0);
    assert.strictEqual(parseTtl(1500), 1500);
  });
  it("parses duration strings", () => {
    assert.strictEqual(parseTtl("30m"), 30 * 60 * 1000);
    assert.strictEqual(parseTtl("12h"), 12 * 60 * 60 * 1000);
    assert.strictEqual(parseTtl("1d"), 24 * 60 * 60 * 1000);
    assert.strictEqual(parseTtl("2w"), 2 * 7 * 24 * 60 * 60 * 1000);
  });
  it("tolerates whitespace and case", () => {
    assert.strictEqual(parseTtl(" 12 H "), 12 * 60 * 60 * 1000);
  });
  it("treats a bare-number string as raw milliseconds", () => {
    assert.strictEqual(parseTtl("0"), 0);
    assert.strictEqual(parseTtl("1500"), 1500);
  });
  it("throws on an unrecognized string", () => {
    assert.throws(() => parseTtl("5x"), /Invalid cache\.ttl/u);
    assert.throws(() => parseTtl("abc"), /Invalid cache\.ttl/u);
  });
  it("throws on a negative number", () => {
    assert.throws(() => parseTtl(-1), /Invalid cache\.ttl/u);
  });
});

describe("resolveCacheDir", () => {
  it("returns an absolute path unchanged", () => {
    const abs = path.resolve("/data/cache");
    assert.strictEqual(resolveCacheDir(abs, "/project"), abs);
  });
  it("resolves a relative path against cwd", () => {
    assert.strictEqual(
      resolveCacheDir(".cache/schemastore", "/project"),
      path.resolve("/project", ".cache/schemastore"),
    );
  });
  it("uses the default cache directory when unset", () => {
    assert.strictEqual(
      resolveCacheDir(undefined, "/project"),
      DEFAULT_CACHE_DIR,
    );
    assert.ok(DEFAULT_CACHE_DIR.endsWith(".cached_schemastore"));
  });
});

describe("getCacheSettings", () => {
  it("resolves cacheDir and ttl from settings", () => {
    const context = {
      settings: {
        "json-schema-validator": {
          cache: { path: "/abs/cache", ttl: "1d" },
        },
      },
      cwd: "/project",
    } as unknown as RuleContext;
    const result = getCacheSettings(context);
    assert.strictEqual(result.cacheDir, "/abs/cache");
    assert.strictEqual(result.ttl, 24 * 60 * 60 * 1000);
  });
  it("falls back to defaults when cache settings are absent", () => {
    const context = {
      settings: {},
      cwd: "/project",
    } as unknown as RuleContext;
    const result = getCacheSettings(context);
    assert.strictEqual(result.ttl, DEFAULT_TTL);
    assert.strictEqual(result.cacheDir, DEFAULT_CACHE_DIR);
  });
});
