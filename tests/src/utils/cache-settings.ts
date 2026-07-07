import assert from "assert";
import path from "path";
import {
  DEFAULT_TTL,
  parseTtl,
  resolveCacheDir,
} from "../../../src/utils/cache-settings.ts";
import * as meta from "../../../src/meta.ts";

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
  it("uses XDG_CACHE_HOME on linux when unset", () => {
    const dir = resolveCacheDir(undefined, "/project", {
      platform: "linux",
      env: { XDG_CACHE_HOME: "/xdg" },
      homedir: () => "/home/me",
    });
    assert.strictEqual(dir, path.join("/xdg", meta.name));
  });
  it("falls back to ~/.cache on linux without XDG_CACHE_HOME", () => {
    const dir = resolveCacheDir(undefined, "/project", {
      platform: "linux",
      env: {},
      homedir: () => "/home/me",
    });
    assert.strictEqual(dir, path.join("/home/me", ".cache", meta.name));
  });
  it("uses ~/Library/Caches on darwin", () => {
    const dir = resolveCacheDir(undefined, "/project", {
      platform: "darwin",
      env: {},
      homedir: () => "/Users/me",
    });
    assert.strictEqual(
      dir,
      path.join("/Users/me", "Library", "Caches", meta.name),
    );
  });
  it("uses LOCALAPPDATA on win32", () => {
    const dir = resolveCacheDir(undefined, "/project", {
      platform: "win32",
      env: { LOCALAPPDATA: "C:\\Users\\me\\AppData\\Local" },
      homedir: () => "C:\\Users\\me",
    });
    assert.strictEqual(
      dir,
      path.join("C:\\Users\\me\\AppData\\Local", meta.name),
    );
  });
});
