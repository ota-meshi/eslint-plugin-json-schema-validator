import request from "request"

/**
 * GET Method using http modules.
 */
export default function get(
    url: string,
    options?: request.CoreOptions,
): Promise<string> {
    return new Promise((resolve, reject) => {
        request.get(url, options, (error, _response, body) => {
            if (error) {
                reject(error)
            }
            resolve(body)
        })
    })
}
