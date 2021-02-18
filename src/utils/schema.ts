import path from "path"
import fs from "fs"
import type { RuleContext } from "../types"
import { syncGet, get } from "./http-client"
import debugBuilder from "debug"
const debug = debugBuilder("eslint-plugin-json-schema-validator:utils-schema")

const TTL = 1000 * 60 * 60 * 24
const RELOADING = new Set<string>()

// eslint-disable-next-line @typescript-eslint/ban-types -- ignore
type Schema = object

/**
 * Converts the given URL to the path of the schema file.
 */
export function urlToSchemastoreFilePath(url: string): string | null {
    if (/^https?:\/\/json\.schemastore\.org\//u.test(url)) {
        const jsonPath = url.replace(/^https?:\/\//u, "")
        if (jsonPath.endsWith(".json")) {
            return jsonPath
        }
        return `${jsonPath}.json`
    }
    return null
}
/**
 * Load schema data
 */
export function loadSchema(
    schemaPath: string,
    context: RuleContext,
): null | Schema {
    if (schemaPath.startsWith("http://") || schemaPath.startsWith("https://")) {
        const jsonPath = urlToSchemastoreFilePath(schemaPath)
        if (!jsonPath) {
            return loadSchemaFromURL(schemaPath, context)
        }
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports -- ignore
            return require(`../../schemastore/${jsonPath}`)
        } catch {
            // error
        }
        return loadSchemaFromURL(schemaPath, context)
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- ignore
    return require(path.resolve(getCwd(context), schemaPath))
}

/**
 * Load schema data from url
 */
function loadSchemaFromURL(
    schemaUrl: string,
    context: RuleContext,
): null | Schema {
    let jsonPath = schemaUrl.replace(/^https?:\/\//u, "")
    if (!jsonPath.endsWith(".json")) {
        jsonPath = `${jsonPath}.json`
    }

    const jsonFilePath = path.join(
        __dirname,
        `../../.cached_schemastore/${jsonPath}`,
    )

    const options = context.settings?.["json-schema-validator"]?.http

    const httpRequestOptions = options?.requestOptions ?? {}
    const httpGetModulePath = resolvePath(options?.getModulePath, context)

    makeDirs(path.dirname(jsonFilePath))
    if (fs.existsSync(jsonFilePath)) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires -- ignore
        const { schema, timestamp } = require(jsonFilePath) as {
            schema: Schema
            timestamp: number
        }
        if (schema != null && typeof timestamp === "number") {
            if (timestamp + TTL < Date.now()) {
                // Reload!
                // However, the data can actually be used the next time access it.
                if (!RELOADING.has(schemaUrl)) {
                    RELOADING.add(schemaUrl)
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises -- ignore
                    get(schemaUrl, httpRequestOptions, httpGetModulePath).then(
                        (json) => {
                            postProcess(schemaUrl, jsonFilePath, json, context)
                            RELOADING.delete(schemaUrl)
                        },
                    )
                }
            }
            return schema
        }
    }

    let json: string
    try {
        json = syncGet(schemaUrl, httpRequestOptions, httpGetModulePath)
    } catch (e) {
        debug(e.message)
        // context.report({
        //     loc: { line: 1, column: 0 },
        //     message: `Could not be resolved: "${schemaPath}"`,
        // })
        return null
    }

    return postProcess(schemaUrl, jsonFilePath, json, context)
}

/**
 * Post process
 */
function postProcess(
    schemaUrl: string,
    jsonFilePath: string,
    json: string,
    context: RuleContext,
): Schema | null {
    let schema
    try {
        schema = JSON.parse(json)
    } catch {
        context.report({
            loc: { line: 1, column: 0 },
            message: `Could not be parsed JSON: "${schemaUrl}"`,
        })
        return null
    }

    fs.writeFileSync(
        jsonFilePath,
        schemaStringify({ schema, timestamp: Date.now() }),
    )
    delete require.cache[jsonFilePath]

    return schema
}

/**
 * Make directories
 */
function makeDirs(dir: string) {
    const dirs = [dir]
    while (!fs.existsSync(dirs[0])) {
        dirs.unshift(path.dirname(dirs[0]))
    }
    dirs.shift()
    for (const dir of dirs) {
        fs.mkdirSync(dir)
    }
}

/**
 * JSON Schema to string
 */
function schemaStringify(schema: Schema) {
    return JSON.stringify(schema, (_key, value) => {
        // if (key === "description" && typeof value === "string") {
        //     return undefined
        // }
        return value
    })
}

/**
 * Resolve module path
 */
function resolvePath(modulePath: string | void, context: RuleContext) {
    if (!modulePath) {
        return undefined
    }
    if (modulePath.startsWith(".")) {
        return path.join(getCwd(context), modulePath)
    }
    return modulePath
}

/**
 * Get cwd
 */
function getCwd(context: RuleContext) {
    if (context.getCwd) {
        return context.getCwd()
    }
    return path.resolve("")
}
