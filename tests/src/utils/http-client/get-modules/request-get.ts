import request from "request"

/**
 * GET Method using request module.
 */
export default function get(
    url: string,
    options?: request.CoreOptions,
): Promise<string> {
    const proxy: string =
        (options as any)?.proxy ||
        // eslint-disable-next-line no-process-env -- ignore
        process.env.http_proxy ||
        // eslint-disable-next-line no-process-env -- ignore
        process.env.npm_config_https_proxy
    return new Promise((resolve, reject) => {
        request.get(url, { ...options, proxy }, (error, _response, body) => {
            if (error) {
                reject(error)
            }
            resolve(body)
        })
    })
}
