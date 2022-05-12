import type { RequestOptions } from "https"
import { runAsWorker } from "synckit"
import { get } from "./http"

runAsWorker(
    async (url: string, options?: RequestOptions, httpModulePath?: string) => {
        return get(url, options, httpModulePath)
    },
)
