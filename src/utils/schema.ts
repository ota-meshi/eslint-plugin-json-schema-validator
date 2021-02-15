import path from "path"
import fs from "fs"
import type { RuleContext } from "../types"
import { syncGet } from "./http-client"

// eslint-disable-next-line @typescript-eslint/ban-types -- ignore
type Schema = object

/**
 * Converts the given URL to the path of the schema file.
 */
export function urlToSchemastoreFilePath(url: string): string | null {
    if (
        /^https?:\/\/json\.schemastore\.org\//u.test(url) ||
        url.startsWith(
            "https://raw.githubusercontent.com/angular/angular-cli",
        ) ||
        url.startsWith("https://yarnpkg.com/")
    ) {
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
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- ignore
        return require(`../../schemastore/${jsonPath}`)
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- ignore
    return require(path.resolve(getCwd(), schemaPath))

    /**
     * Get cwd
     */
    function getCwd() {
        if (context.getCwd) {
            return context.getCwd()
        }
        return path.resolve("")
    }
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
    makeDirs(path.dirname(jsonFilePath))
    if (fs.existsSync(jsonFilePath)) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- ignore
        return require(jsonFilePath)
    }

    let json: string
    try {
        json = syncGet(schemaUrl)
    } catch (e) {
        // context.report({
        //     loc: { line: 1, column: 0 },
        //     message: `Could not be resolved: "${schemaPath}"`,
        // })
        return null
    }
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

    fs.writeFileSync(jsonFilePath, schemaStringify(schema))

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
    return JSON.stringify(schema, (key, value) => {
        if (key === "description" && typeof value === "string") {
            return undefined
        }
        return value
    })
}
