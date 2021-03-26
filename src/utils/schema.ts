import path from "path"
import fs from "fs"
import type { RuleContext } from "../types"
import { syncGet, get } from "./http-client"
import debugBuilder from "debug"
import type { SchemaObject } from "./types"
import { draft7 as migrateToDraft7 } from "json-schema-migrate"
const debug = debugBuilder("eslint-plugin-json-schema-validator:utils-schema")

const TTL = 1000 * 60 * 60 * 24
const RELOADING = new Set<string>()

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
): null | SchemaObject {
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
    const json = fs.readFileSync(
        path.resolve(getCwd(context), schemaPath),
        "utf-8",
    )
    const schema = JSON.parse(json)
    migrateToDraft7(schema)
    return schema
}

/**
 * Load schema data from url
 */
function loadSchemaFromURL(
    schemaUrl: string,
    context: RuleContext,
): null | SchemaObject {
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
            schema: SchemaObject
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
): SchemaObject | null {
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

    migrateToDraft7(schema)

    fs.writeFileSync(
        jsonFilePath,
        schemaStringify({
            schema,
            timestamp: Date.now(),
            // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports -- ignore
            v: require("../../package.json").version,
        }),
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
function schemaStringify(schema: SchemaObject) {
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
