import type { RequestOptions } from "https"
import { get } from "./http"

// eslint-disable-next-line @typescript-eslint/no-floating-promises -- CLI main
main()

/**
 * Main
 */
async function main() {
    try {
        const args = process.argv.slice(-2)
        const url: string = args[0]
        const options: RequestOptions = JSON.parse(args[1])
        const result = await get(url, options)
        // eslint-disable-next-line no-console -- CLI
        console.log(result)
    } catch (e) {
        // eslint-disable-next-line no-console -- CLI
        console.error(e.message)
        // eslint-disable-next-line no-process-exit -- CLI
        process.exit(1)
    }
}
