import type { RequestOptions } from "https";
import path from "path";
import { createSyncFn } from "synckit";

const ext = path.extname(__filename);
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
