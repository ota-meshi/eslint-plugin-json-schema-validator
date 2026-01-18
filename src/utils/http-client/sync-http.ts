import type { RequestOptions } from "https";
import { createRequire } from "module";
import path from "path";
import { createSyncFn } from "synckit";

const filename = import.meta.filename;
const require = createRequire(filename);
const ext = path.extname(filename);
const getSync = createSyncFn(require.resolve(`./worker${ext}`));

/**
 * Synchronously GET Method
 */
export function syncGet(
  url: string,
  options?: RequestOptions,
  httpModulePath?: string,
): string {
  return getSync(url, options, httpModulePath) as string;
}
