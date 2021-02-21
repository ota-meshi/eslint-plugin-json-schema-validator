// eslint-disable-next-line eslint-comments/disable-enable-pair -- ignore
/* eslint-disable complexity -- ignore */
import path from "path"
import fs from "fs"
import { loadSchema } from "../../../src/utils/schema"
import { compile } from "../../../src/utils/validator-factory"
import type { RuleContext } from "../../../src/types"
const SCHEMASTORE_ROOT = path.join(
    __dirname,
    "../../../schemastore/json.schemastore.org",
)

describe("Validator Factory.", () => {
    const ctx = {
        report({ message }: any): void {
            throw new Error(message)
        },
    } as RuleContext
    describe("Loads the schema and does not crash.", () => {
        for (const fileName of listupFiles(SCHEMASTORE_ROOT)) {
            if (
                // Does not support v4.
                fileName.endsWith("swagger-2.0.json") || // exclusiveMinimum value must be ["number"]
                // Schema bug?
                fileName.endsWith("cirrus.json") || // cannot resolve id
                fileName.endsWith("compilerconfig.json") || // cannot resolve id
                fileName.endsWith("datalogic-scan2deploy-ce.json") || // Incorrect $id
                fileName.endsWith("cryproj.52.schema.json") || // Maximum call stack size exceeded
                fileName.endsWith("cryproj.53.schema.json") || // Maximum call stack size exceeded
                fileName.endsWith("cryproj.54.schema.json") || // Maximum call stack size exceeded
                fileName.endsWith("cryproj.55.schema.json") || // Maximum call stack size exceeded
                fileName.endsWith("cryproj.dev.schema.json") || // Maximum call stack size exceeded
                fileName.endsWith("cryproj.json") || // Maximum call stack size exceeded
                fileName.endsWith(
                    "azure-iot-edge-deployment-template-2.0.json",
                ) || // Invalid regular expression
                fileName.endsWith("jekyll.json") || // Invalid regular expression
                fileName.endsWith("mimetypes.json") || // Invalid regular expression
                fileName.endsWith("nodemon.json") || // Invalid regular expression
                fileName.endsWith("opspec-io-0.1.7.json") || // Invalid regular expression
                fileName.endsWith("sarif-2.1.0-rtm.2.json") || // Invalid regular expression
                fileName.endsWith("sarif-2.1.0-rtm.3.json") || // Invalid regular expression
                fileName.endsWith("sarif-2.1.0-rtm.4.json") || // Invalid regular expression
                fileName.endsWith("sarif-2.1.0-rtm.5.json") || // Invalid regular expression
                fileName.endsWith("sarif-2.1.0.json") || // Invalid regular expression
                fileName.endsWith(
                    "sarif-external-property-file-2.1.0-rtm.2.json",
                ) || // Invalid regular expression
                fileName.endsWith(
                    "sarif-external-property-file-2.1.0-rtm.3.json",
                ) || // Invalid regular expression
                fileName.endsWith(
                    "sarif-external-property-file-2.1.0-rtm.4.json",
                ) || // Invalid regular expression
                fileName.endsWith(
                    "sarif-external-property-file-2.1.0-rtm.5.json",
                ) || // Invalid regular expression
                fileName.endsWith("sarif-external-property-file-2.1.0.json") || // Invalid regular expression
                fileName.endsWith("vs-2017.3.host.json") || // Invalid regular expression
                // So big file X(
                fileName.endsWith("ansible-role-2.9.json") ||
                fileName.endsWith("ansible-playbook.json")
            ) {
                continue
            }
            it(fileName, () => {
                const schema = loadSchema(fileName, ctx)

                const validator = compile(
                    schema!,
                    `https://json.schemastore.org${fileName.slice(
                        SCHEMASTORE_ROOT.length,
                    )}`,
                    ctx,
                )
                validator({})
            })
        }
    })
})

function* listupFiles(rootDir: string): IterableIterator<string> {
    for (const filename of fs.readdirSync(rootDir)) {
        const abs = path.join(rootDir, filename)
        if (filename.endsWith(".json")) {
            yield abs
        }
    }
}
