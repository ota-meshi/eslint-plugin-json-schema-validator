import type { RequestOptions } from "https"
import { get } from "./http"

// eslint-disable-next-line @typescript-eslint/no-floating-promises -- CLI main
main()

/**
 * Main
 */
async function main() {
    try {
        const args = process.argv.slice(-3)
        const url: string = args[0]
        const options: RequestOptions = JSON.parse(args[1])
        const { httpModulePath } = JSON.parse(args[2])
        const result = await get(url, options, httpModulePath)
        // eslint-disable-next-line no-console -- CLI
        console.log(result)
    } catch (e) {
        // eslint-disable-next-line no-console -- CLI
        console.error(e.message)
        // eslint-disable-next-line no-process-exit -- CLI
        process.exit(1)
    }
}
