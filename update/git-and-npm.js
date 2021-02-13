"use strict"

const spawn = require("child_process").spawn

module.exports = { git, npm }

/** Git command */
function git(...args) {
    return new Promise((resolve) => {
        let stdout = ""
        const cmd = spawn("git", args)
        cmd.stdout.on("data", (data) => {
            // eslint-disable-next-line no-console -- tool
            console.log(`${data}`)
            stdout += data
        })
        cmd.on("exit", (code) => {
            resolve({ code, stdout })
        })
    })
}

/** Npm command */
function npm(...args) {
    return new Promise((resolve) => {
        let stdout = ""
        const cmd = spawn("npm", args)
        cmd.stdout.on("data", (data) => {
            // eslint-disable-next-line no-console -- tool
            console.log(`${data}`)
            stdout += data
        })
        cmd.on("exit", (code) => {
            resolve({ code, stdout })
        })
    })
}
