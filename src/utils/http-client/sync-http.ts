import type { RequestOptions } from "https";
import { createSyncFn } from "synckit";

const getSync = createSyncFn(require.resolve("./worker"));

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
