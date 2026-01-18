import type { RequestOptions } from "https";
import defaultClient from "./get-modules/http";
import { createRequire } from "module";
import { isAbsolute } from "path";
import { pathToFileURL } from "url";

/**
 * GET Method
 */
export async function get(
  url: string,
  options?: RequestOptions,
  httpModulePath?: string,
): Promise<string> {
  const client = httpModulePath
    ? await loadModule(httpModulePath)
    : defaultClient;
  return client.default ? client.default(url, options) : client(url, options);
}

/**
 * Load module by path
 */
async function loadModule(modulePath: string) {
  const adjustedPath =
    !modulePath.startsWith("file://") && isAbsolute(modulePath)
      ? pathToFileURL(modulePath).href
      : modulePath;
  try {
    const require = createRequire(import.meta.filename);
    return require(adjustedPath);
  } catch {
    return await import(adjustedPath);
  }
}
