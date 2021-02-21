// eslint-disable-next-line eslint-comments/disable-enable-pair -- ignore
/* eslint-disable complexity -- ignore */
import path from "path"
import fs from "fs"
import { loadSchema } from "../../../../../src/utils/schema"
import { compile } from "../../../../../src/utils/validator-factory/@exodus/schemasafe"
import type { RuleContext } from "../../../../../src/types"
const SCHEMASTORE_ROOT = path.join(
    __dirname,
    "../../../../../schemastore/json.schemastore.org",
)

describe("Validator Factory.", () => {
    const ctx = {
        report({ message }: any): void {
            throw new Error(message)
        },
    } as RuleContext
    describe("Loads the schema and does not crash.", () => {
        for (const fileName of listupFiles(SCHEMASTORE_ROOT)) {
            // Schema bug?
            if (
                fileName.endsWith("cloudify.json") ||
                fileName.endsWith("creatomic.json") ||
                fileName.endsWith("dependabot-2.0.json") ||
                fileName.endsWith("dependabot.json") ||
                fileName.endsWith("drone.json") ||
                fileName.endsWith("gitlab-ci.json") ||
                fileName.endsWith("pocketmine-plugin.json") ||
                fileName.endsWith("prisma.json") ||
                fileName.endsWith("tslint.json") ||
                fileName.endsWith("ui5-manifest.json") ||
                fileName.endsWith("sarif-2.1.0-rtm.2.json") ||
                fileName.endsWith(
                    "sarif-external-property-file-2.1.0-rtm.2.json",
                ) ||
                fileName.endsWith(
                    "sarif-external-property-file-2.1.0-rtm.3.json",
                ) ||
                fileName.endsWith(
                    "sarif-external-property-file-2.1.0-rtm.4.json",
                ) ||
                fileName.endsWith(
                    "sarif-external-property-file-2.1.0-rtm.5.json",
                ) ||
                // Invalid $ref
                fileName.endsWith("cirrus.json") ||
                fileName.endsWith("opspec-io-0.1.7.json") ||
                // Invalid regular expression
                fileName.endsWith(
                    "azure-iot-edge-deployment-template-2.0.json",
                ) ||
                fileName.endsWith("jekyll.json") ||
                fileName.endsWith("mimetypes.json") ||
                fileName.endsWith("sarif-2.1.0-rtm.3.json") ||
                fileName.endsWith("sarif-2.1.0-rtm.4.json") ||
                fileName.endsWith("sarif-2.1.0-rtm.5.json") ||
                fileName.endsWith("sarif-2.1.0.json") ||
                fileName.endsWith("vs-2017.3.host.json") ||
                false
            ) {
                continue
            }
            if (
                // Cannot resolve format
                fileName.endsWith("chrome-manifest.json") ||
                fileName.endsWith("cloudbuild.json") ||
                fileName.endsWith("dss-2.0.0.json") ||
                fileName.endsWith("lsdlschema.json") ||
                fileName.endsWith("xs-app.json") ||
                fileName.endsWith("ansible-playbook.json") ||
                fileName.endsWith("compilerconfig.json") ||
                fileName.endsWith("nodemon.json") ||
                false
            ) {
                continue
            }
            // Bug of @exodus/schemasafe?
            if (
                fileName.endsWith("bitrise-step.json") ||
                fileName.endsWith("bitrise.json") ||
                fileName.endsWith("electron-builder.json") ||
                fileName.endsWith("geojson.json") ||
                fileName.endsWith("haxelib.json") ||
                fileName.endsWith("sarif-external-property-file-2.1.0.json") ||
                false
            ) {
                continue
            }
            // So big file X(
            if (
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
