"use strict"

const updateSchemaStore = require("./update-schemastore")
const checkDiff = require("./check-diff")
const { git, npm } = require("./git-and-npm")

main()

/** Main */
async function main() {
    await updateSchemaStore()
    if (!(await checkDiff())) {
        return
    }

    // eslint-disable-next-line no-process-env -- ignore
    const GITHUB_ACTOR = process.env.GITHUB_ACTOR || "dummy"

    await git("config", "user.name", GITHUB_ACTOR)
    await git(
        "config",
        "user.email",
        `${GITHUB_ACTOR}@users.noreply.github.com`,
    )
    await git("add", ".")
    await git("commit", "-m", "Update schema store")
    await npm("version", "patch")

    // eslint-disable-next-line no-process-env -- ignore
    const { GITHUB_TOKEN } = process.env
    await git(
        "push",
        `https://${GITHUB_ACTOR}:${GITHUB_TOKEN}@github.com/ota-meshi/eslint-plugin-json-schema-validator.git`,
        "--tags",
    )
}
