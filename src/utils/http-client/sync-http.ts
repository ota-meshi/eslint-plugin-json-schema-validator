import type { RequestOptions } from "https"
import { spawnSync } from "child_process"
import path from "path"

/**
 * Synchronously GET Method
 */
export function syncGet(
    url: string,
    options?: RequestOptions,
    httpModulePath?: string,
): string {
    const httpScriptPath = require.resolve("./cli")
    const execPath = process.execPath
    const optionsJSON = JSON.stringify(options ?? {})
    const cliArgs = [
        httpScriptPath,
        url,
        optionsJSON,
        JSON.stringify({ httpModulePath }),
    ]
    if (path.extname(httpScriptPath) === ".ts") {
        cliArgs.unshift("--require", "ts-node/register/transpile-only")
    }
    const result = spawnSync(execPath, cliArgs, {
        windowsHide: true,
        maxBuffer: Infinity,
    })

    if (result.error) {
        throw result.error
    }
    if (result.status !== 0) {
        throw new Error(
            `Failed:\n${result.stdout.toString()}\n${result.stderr.toString()}`,
        )
    }
    return result.stdout.toString("utf8")
}
