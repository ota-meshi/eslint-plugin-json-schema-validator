import type { RequestOptions } from "https";
import defaultClient from "./get-modules/http";
import { createRequire } from "module";

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
function loadModule(modulePath: string) {
  // TODO test
  console.log(modulePath);
  try {
    const require = createRequire(import.meta.filename);
    return require(modulePath);
  } catch {
    return import(modulePath);
  }
}
