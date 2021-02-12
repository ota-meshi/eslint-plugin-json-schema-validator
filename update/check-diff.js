"use strict"

const { git } = require("./git-and-npm")

module.exports = async function () {
    const { stdout } = await git("status", "--porcelain")
    return Boolean(stdout)
}
