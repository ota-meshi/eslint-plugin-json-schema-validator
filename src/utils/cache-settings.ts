import path, { dirname } from "path";
import { fileURLToPath } from "url";

import type { RuleContext } from "../types.ts";

/** Default cache TTL: 1 day. */
export const DEFAULT_TTL = 1000 * 60 * 60 * 24;

const UNIT_MS: Record<string, number> = {
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
};

/**
 * Parse a `cache.ttl` setting into milliseconds.
 * Accepts a non-negative millisecond number, or a duration string such as
 * "30m", "12h", "1d", "2w" (case-insensitive, surrounding whitespace allowed).
 * A bare number string (e.g. "0", "1500") with no unit is treated as raw
 * milliseconds.
 * @param value - The raw `cache.ttl` setting value, or `undefined`.
 * @returns The resolved TTL in milliseconds.
 * @throws {Error} If `value` is a negative number or an unrecognized string.
 */
export function parseTtl(value: number | string | undefined): number {
  if (value == null) {
    return DEFAULT_TTL;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(
        `Invalid cache.ttl: ${value}. Expected a non-negative number of milliseconds.`,
      );
    }
    return value;
  }
  const match = /^\s*(\d+(?:\.\d+)?)(?:\s*([dhmw]))?\s*$/iu.exec(value);
  if (!match) {
    throw new Error(
      `Invalid cache.ttl: "${value}". Expected a number of milliseconds or a duration like "30m", "12h", "1d", "2w".`,
    );
  }
  const unit = match[2];
  const multiplier = unit ? UNIT_MS[unit.toLowerCase()] : 1;
  return Number(match[1]) * multiplier;
}

/**
 * The default cache directory, located alongside the built module.
 * This is the historical location and is left unchanged; configuring
 * `cache.path` is the supported way to move it.
 */
export const DEFAULT_CACHE_DIR = path.join(
  dirname(fileURLToPath(import.meta.url)),
  "../.cached_schemastore",
);

/**
 * Resolve the cache directory from a `cache.path` setting.
 * Absolute paths are used as-is; relative paths resolve against `cwd`; when
 * unset, the default cache directory alongside the module is used.
 * @param pathSetting - The raw `cache.path` setting value, or `undefined`.
 * @param cwd - The directory to resolve a relative `pathSetting` against.
 * @returns The resolved absolute cache directory path.
 */
export function resolveCacheDir(
  pathSetting: string | undefined,
  cwd: string,
): string {
  if (pathSetting) {
    return path.isAbsolute(pathSetting)
      ? pathSetting
      : path.resolve(cwd, pathSetting);
  }
  return DEFAULT_CACHE_DIR;
}

/**
 * Resolve the cache directory and TTL for a rule context.
 * @param context - The ESLint rule context, whose `settings["json-schema-validator"].cache`
 * (if present) supplies the raw `path` and `ttl` values.
 * @returns The resolved absolute cache directory and TTL in milliseconds.
 */
export function getCacheSettings(context: RuleContext): {
  cacheDir: string;
  ttl: number;
} {
  const cache = context.settings?.["json-schema-validator"]?.cache;
  return {
    cacheDir: resolveCacheDir(cache?.path, context.cwd),
    ttl: parseTtl(cache?.ttl),
  };
}
