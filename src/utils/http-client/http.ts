import type { RequestOptions } from "https"
import https from "https"
import http from "https"
import { URL } from "url"

const TIMEOUT = 30000

/**
 * GET Method
 */
export function get(url: string, options?: RequestOptions): Promise<string> {
    const client = url.startsWith("https") ? https : http
    return new Promise((resolve, reject) => {
        let result = ""
        const req = client.get(
            {
                ...options,
                ...urlToOptions(url),
            },
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

/** URL to options */
function urlToOptions(urlStr: string) {
    const url = new URL(urlStr)
    const options: RequestOptions = {
        protocol: url.protocol,
        hostname:
            typeof url.hostname === "string" && url.hostname.startsWith("[")
                ? url.hostname.slice(1, -1)
                : url.hostname,
        path: `${url.pathname || ""}${url.search || ""}`,
    }
    if (url.port !== "") {
        options.port = Number(url.port)
    }
    if (url.username || url.password) {
        options.auth = `${url.username}:${url.password}`
    }
    return options
}
