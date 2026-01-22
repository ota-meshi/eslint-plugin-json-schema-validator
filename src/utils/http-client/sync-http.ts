import type { RequestOptions } from "https";
import { createRequire } from "module";
import path from "path";
import { createSyncFn } from "synckit";

const require = createRequire(import.meta.url);
const ext = path.extname(import.meta.filename);
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
