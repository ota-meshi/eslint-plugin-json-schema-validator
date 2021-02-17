import type { RequestOptions } from "https"
import https from "https"
import http from "http"
import { URL } from "url"
// @ts-expect-error -- no types
import tunnel from "tunnel-agent"

const TIMEOUT = 10000

/**
 * GET Method using http modules.
 */
export default function get(
    url: string,
    options?: RequestOptions,
): Promise<string> {
    const client = url.startsWith("https") ? https : http
    const parsedOptions = parseUrlAndOptions(url, options || {})

    return new Promise((resolve, reject) => {
        let result = ""
        const req = client.get(parsedOptions, (res) => {
            res.on("data", (chunk) => {
                result += chunk
            })
            res.on("end", () => {
                resolve(result)
            })
        })
        req.on("error", (e) => {
            reject(e)
        })
        req.setTimeout(TIMEOUT, function handleRequestTimeout() {
            if (req.destroy) {
                req.destroy()
            } else {
                req.abort()
            }
            reject(new Error(`Timeout of ${TIMEOUT}ms exceeded`))
        })
    })
}

/** Parse URL and options */
function parseUrlAndOptions(urlStr: string, baseOptions: RequestOptions) {
    const url = new URL(urlStr)
    const hostname =
        typeof url.hostname === "string" && url.hostname.startsWith("[")
            ? url.hostname.slice(1, -1)
            : url.hostname
    const options: RequestOptions = {
        ...baseOptions,
        protocol: url.protocol,
        hostname,
        path: `${url.pathname || ""}${url.search || ""}`,
    }
    if (url.port !== "") {
        options.port = Number(url.port)
    }
    if (url.username || url.password) {
        options.auth = `${url.username}:${url.password}`
    }

    const PROXY_ENV = [
        "https_proxy",
        "HTTPS_PROXY",
        "http_proxy",
        "HTTP_PROXY",
        "npm_config_https_proxy",
        "npm_config_http_proxy",
    ]

    const proxyStr: string =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
        (options as any)?.proxy ||
        // eslint-disable-next-line no-process-env -- ignore
        PROXY_ENV.map((k) => process.env[k]).find((v) => v)
    if (proxyStr) {
        const proxyUrl = new URL(proxyStr)

        options.agent = tunnel[
            `http${url.protocol === "https:" ? "s" : ""}OverHttp${
                proxyUrl.protocol === "https:" ? "s" : ""
            }`
        ]({
            proxy: {
                host: proxyUrl.hostname,
                port: Number(proxyUrl.port),
                proxyAuth:
                    proxyUrl.username || proxyUrl.password
                        ? `${proxyUrl.username}:${proxyUrl.password}`
                        : undefined,
            },
        })
    }
    return options
}
