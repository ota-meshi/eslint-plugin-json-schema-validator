import type { RequestOptions } from "https"
import https from "https"
import http from "http"
import { URL } from "url"

const TIMEOUT = 10000

/**
 * GET Method using http modules.
 */
export default function get(
    url: string,
    options?: RequestOptions,
): Promise<string> {
    const client =
        url.startsWith("https") && !maybeProxy(options) ? https : http
    return new Promise((resolve, reject) => {
        let result = ""
        const req = client.get(
            parseUrlAndOptions(url, options || {}),
            (res) => {
                res.on("data", (chunk) => {
                    result += chunk
                })
                res.on("end", () => {
                    resolve(result)
                })
            },
        )
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
    let options: RequestOptions
    const url = new URL(urlStr)
    const hostname =
        typeof url.hostname === "string" && url.hostname.startsWith("[")
            ? url.hostname.slice(1, -1)
            : url.hostname
    if (maybeProxy(baseOptions)) {
        // maybe proxy
        options = {
            ...baseOptions,
            protocol: "https:",
            path: urlStr,
            headers: {
                Host: hostname,
            },
        }
        if (baseOptions.headers) {
            options.headers = { ...options.headers, ...baseOptions.headers }
        }
    } else {
        options = {
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
    }
    return options
}

/**
 * Maybe proxy request
 */
function maybeProxy(options?: RequestOptions) {
    return options && ((options.host && options.port) || options.hostname)
}
