/**
 * Converts the given URL to the path of the schema file.
 */
export function urlToSchemastoreFilePath(url: string): string | null {
    if (
        /^https?:\/\/json\.schemastore\.org\//u.test(url) ||
        url.startsWith(
            "https://raw.githubusercontent.com/angular/angular-cli",
        ) ||
        url.startsWith("https://yarnpkg.com/")
    ) {
        const jsonPath = url.replace(/^https?:\/\//u, "")
        if (jsonPath.endsWith(".json")) {
            return jsonPath
        }
        return `${jsonPath}.json`
    }
    return null
}
