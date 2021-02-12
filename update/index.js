"use strict"

const https = require("https")
const fs = require("fs")
const path = require("path")

const SCHEMASTORE_ROOT = path.resolve(__dirname, "../schemastore")
const CATALOG_URL = "https://www.schemastore.org/api/json/catalog.json"

const ALLOWED_LIST = ["https://json.schemastore.org/"]

/**
 * Make directories
 */
function makeDirs(dir) {
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
function fetchAndSave(url, isSchema) {
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
                    let text = isSchema ? reduceSchema(result) : result
                    fs.writeFileSync(fileName, text, "utf8")
                    setTimeout(() => resolve(text), 100)
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
function reduceSchema(text) {
    return JSON.stringify(JSON.parse(text), (key, value) => {
        if (key === "description" && typeof value === "string") {
            return undefined
        }
        return value
    })
}

main()

/** Main */
async function main() {
    const catalogText = await fetchAndSave(CATALOG_URL)

    for (const schemaData of JSON.parse(catalogText).schemas) {
        if (ALLOWED_LIST.some((allow) => schemaData.url.startsWith(allow))) {
            await fetchAndSave(schemaData.url, true)
        } else {
            console.warn(`Ignore: ${schemaData.url}`)
        }
    }
}
