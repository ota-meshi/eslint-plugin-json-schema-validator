import { git } from "./git-and-npm"

/**
 * Check diff
 */
export default async function (): Promise<boolean> {
    const { stdout } = await git("status", "--porcelain")
    return Boolean(stdout)
}
