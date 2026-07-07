import os from "os";
import path from "path";

import * as meta from "../meta.ts";

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
  const match = /^\s*(\d+(?:\.\d+)?)\s*([dhmw])\s*$/iu.exec(value);
  if (!match) {
    throw new Error(
      `Invalid cache.ttl: "${value}". Expected a number of milliseconds or a duration like "30m", "12h", "1d", "2w".`,
    );
  }
  return Number(match[1]) * UNIT_MS[match[2].toLowerCase()];
}

/** Injectable platform dependencies, used to make `resolveCacheDir` testable across OSes. */
export interface PlatformDeps {
  platform?: NodeJS.Platform;
  env?: NodeJS.ProcessEnv;
  homedir?: () => string;
}

/**
 * Resolve the OS user cache base directory.
 * @param deps - Injectable platform dependencies (platform, env, homedir).
 * @returns The OS-specific base directory under which per-app cache
 * directories are conventionally stored.
 */
function osCacheBaseDir({
  platform = process.platform,
  // eslint-disable-next-line no-process-env -- default only used when no deps are injected (e.g. real usage, not tests)
  env = process.env,
  homedir = os.homedir,
}: PlatformDeps = {}): string {
  const home = homedir();
  if (platform === "win32") {
    return env.LOCALAPPDATA || path.join(home, "AppData", "Local");
  }
  if (platform === "darwin") {
    return path.join(home, "Library", "Caches");
  }
  return env.XDG_CACHE_HOME || path.join(home, ".cache");
}

/**
 * Resolve the cache directory from a `cache.path` setting.
 * Absolute paths are used as-is; relative paths resolve against `cwd`; when
 * unset, the OS user cache directory under the plugin name is used.
 * @param pathSetting - The raw `cache.path` setting value, or `undefined`.
 * @param cwd - The directory to resolve a relative `pathSetting` against.
 * @param deps - Injectable platform dependencies, used when `pathSetting` is
 * unset to determine the OS user cache directory.
 * @returns The resolved absolute cache directory path.
 */
export function resolveCacheDir(
  pathSetting: string | undefined,
  cwd: string,
  deps?: PlatformDeps,
): string {
  if (pathSetting) {
    return path.isAbsolute(pathSetting)
      ? pathSetting
      : path.resolve(cwd, pathSetting);
  }
  return path.join(osCacheBaseDir(deps), meta.name);
}
