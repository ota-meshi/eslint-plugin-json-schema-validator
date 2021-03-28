// eslint-disable-next-line eslint-comments/disable-enable-pair -- tools
/* eslint-disable require-jsdoc -- tools */
import fs from "fs"
import path from "path"
import { draft7 as migrateToDraft7 } from "json-schema-migrate"
const SCHEMASTORE_ROOT = path.join(
    __dirname,
    "../../schemastore/json.schemastore.org",
)
for (const fileName of listupFiles(SCHEMASTORE_ROOT)) {
    const text = fs.readFileSync(fileName, "utf8")
    fs.writeFileSync(fileName, reduceSchema(text), "utf8")
}

function* listupFiles(rootDir: string): IterableIterator<string> {
    for (const filename of fs.readdirSync(rootDir)) {
        const abs = path.join(rootDir, filename)
        if (filename.endsWith(".json")) {
            yield abs
        }
    }
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
