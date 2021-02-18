import fs from "fs"
import updateSchemaStore from "./update-schemastore"
// eslint-disable-next-line @typescript-eslint/no-floating-promises -- tool
updateSchemaStore().then(() => {
    fs.writeFileSync(
        require.resolve("../../schemastore/timestamp.json"),
        JSON.stringify({ timestamp: Date.now() }),
        "utf8",
    )
})
