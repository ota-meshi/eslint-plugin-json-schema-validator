import { spawn } from "child_process"

/** Git command */
export function git(
    ...args: string[]
): Promise<{ code: number; stdout: string }> {
    return new Promise((resolve, reject) => {
        let stdout = ""
        const cmd = spawn("git", args)
        cmd.stdout.on("data", (data) => {
            // eslint-disable-next-line no-console -- tool
            console.log(`${data}`)
            stdout += data
        })
        cmd.stderr.on("data", (data) => {
            // eslint-disable-next-line no-console -- tool
            console.error(`${data}`)
        })

        cmd.on("error", (err) => reject(err))
        cmd.on("exit", (code) => {
            const exitCode = code || 0
            if (exitCode !== 0) {
                reject(new Error(`ExitCode: ${exitCode}`))
                return
            }
            resolve({ code: exitCode, stdout })
        })
    })
}

/** Npm command */
export function npm(
    ...args: string[]
): Promise<{ code: number; stdout: string }> {
    return new Promise((resolve, reject) => {
        let stdout = ""
        const cmd = spawn("npm", args)
        cmd.stdout.on("data", (data) => {
            // eslint-disable-next-line no-console -- tool
            console.log(`${data}`)
            stdout += data
        })
        cmd.stderr.on("data", (data) => {
            // eslint-disable-next-line no-console -- tool
            console.error(`${data}`)
        })
        cmd.on("error", (err) => reject(err))
        cmd.on("exit", (code) => {
            const exitCode = code || 0
            if (exitCode !== 0) {
                reject(new Error(`ExitCode: ${exitCode}`))
                return
            }
            resolve({ code: exitCode, stdout })
        })
    })
}
