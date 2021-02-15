import type { RequestOptions } from "https"

/**
 * GET Method
 */
export function get(
    url: string,
    options?: RequestOptions,
    httpModulePath?: string,
): Promise<string> {
    const client = httpModulePath
        ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- ignore
          require(httpModulePath)
        : // eslint-disable-next-line @typescript-eslint/no-require-imports -- ignore
          require("./get-modules/http")
    return client.default ? client.default(url, options) : client(url, options)
}
