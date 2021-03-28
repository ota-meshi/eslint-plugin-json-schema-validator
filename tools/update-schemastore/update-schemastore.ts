import fs from "fs"
import path from "path"
import { draft7 as migrateToDraft7 } from "json-schema-migrate"
import { get } from "../../src/utils/http-client"
import { urlToSchemastoreFilePath } from "../../src/utils/schema"

const SCHEMASTORE_ROOT = path.resolve(__dirname, "../../schemastore")
const CATALOG_URL = "https://www.schemastore.org/api/json/catalog.json"

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
 * Fetch and save store
 */
async function fetchAndSave(url: string, isSchema: boolean): Promise<string> {
    // eslint-disable-next-line no-console -- tool
    console.log(`GET: ${url}`)

    const fileName =
        path.join(SCHEMASTORE_ROOT, url.replace(/^https?:\/\//u, "")) +
        (url.endsWith(".json") ? "" : ".json")

    makeDirs(path.dirname(fileName))
    const result = await get(url)
    const text = isSchema ? reduceSchema(result) : result
    fs.writeFileSync(fileName, text, "utf8")
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000))
    return text
}

/**
 * Reduce JSON Schema
 */
function reduceSchema(text: string) {
    const schema = JSON.parse(text)
    const omitted = JSON.parse(
        JSON.stringify(schema, (key, value) => {
            if (key === "description" && typeof value === "string") {
                return undefined
            }
            return value
        }),
    )
    migrateToDraft7(omitted)
    return JSON.stringify(omitted)
}

/** Main */
export default async function main(): Promise<void> {
    const catalogText = await fetchAndSave(CATALOG_URL, false)

    for (const schemaData of JSON.parse(catalogText).schemas) {
        if (urlToSchemastoreFilePath(schemaData.url)) {
            await fetchAndSave(schemaData.url, true)
        } else {
            // eslint-disable-next-line no-console -- tool
            console.warn(`Ignore: ${schemaData.url}`)
        }
    }
}
