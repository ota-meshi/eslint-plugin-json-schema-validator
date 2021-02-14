import https from "https"
import fs from "fs"
import path from "path"
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
function fetchAndSave(url: string, isSchema: boolean): Promise<string> {
    // eslint-disable-next-line no-console -- tool
    console.log(`GET: ${url}`)

    const fileName =
        path.join(SCHEMASTORE_ROOT, url.replace(/^https?:\/\//u, "")) +
        (url.endsWith(".json") ? "" : ".json")

    makeDirs(path.dirname(fileName))
    return new Promise((resolve, reject) => {
        let result = ""
        https
            .get(url, (res) => {
                res.on("data", (chunk) => {
                    result += chunk
                })
                res.on("end", () => {
                    const text = isSchema ? reduceSchema(result) : result
                    fs.writeFileSync(fileName, text, "utf8")
                    setTimeout(() => resolve(text), 1000)
                })
            })
            .on("error", (e) => {
                reject(e)
            })
    })
}

/**
 * Reduce JSON Schema
 */
function reduceSchema(text: string) {
    return JSON.stringify(JSON.parse(text), (key, value) => {
        if (key === "description" && typeof value === "string") {
            return undefined
        }
        return value
    })
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
