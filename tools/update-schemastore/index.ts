import fs from "fs"
import updateSchemaStore from "./update-schemastore"
import checkDiff from "./check-diff"
import { git, npm } from "./git-and-npm"

export default main()

/** Main */
async function main(): Promise<boolean> {
    await updateSchemaStore()
    if (!(await checkDiff())) {
        return false
    }

    fs.writeFileSync(
        require.resolve("../../schemastore/timestamp.json"),
        JSON.stringify({ timestamp: Date.now() }),
        "utf8",
    )

    // eslint-disable-next-line no-process-env -- ignore
    const GITHUB_ACTOR = process.env.GITHUB_ACTOR

    if (GITHUB_ACTOR) {
        await git("config", "user.name", GITHUB_ACTOR)
        await git(
            "config",
            "user.email",
            `${GITHUB_ACTOR}@users.noreply.github.com`,
        )
    }
    await git("add", ".")
    await git("commit", "-m", "Update schema store")
    await npm("version", "patch")

    const version = JSON.parse(
        fs.readFileSync(require.resolve("../../package"), "utf8"),
    ).version
    // eslint-disable-next-line no-process-env -- ignore
    const { GITHUB_TOKEN } = process.env
    await git(
        "push",
        `https://${GITHUB_ACTOR}:${GITHUB_TOKEN}@github.com/ota-meshi/eslint-plugin-json-schema-validator.git`,
        "main",
        `v${version}`,
    )

    return true
}
