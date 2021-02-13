import { spawn } from "child_process"

/** Git command */
export function git(
    ...args: string[]
): Promise<{ code: number; stdout: string }> {
    return new Promise((resolve, reject) => {
        let stdout = ""
        const cmd = spawn("git", args)
        cmd.stdout.on("data", (data) => {
            process.stdout.write(data)
            stdout += data
        })
        cmd.stderr.pipe(process.stderr)

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
            process.stdout.write(data)
            stdout += data
        })
        cmd.stderr.pipe(process.stderr)
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
