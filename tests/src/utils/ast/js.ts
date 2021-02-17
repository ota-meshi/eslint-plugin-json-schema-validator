import assert from "assert"
import path from "path"
import fs from "fs"
import { Linter } from "eslint"
import type { AnalyzedJsAST, PathData } from "../../../../src/utils/ast/js"
import { analyzeJsAST } from "../../../../src/utils/ast/js"
import type { ESLintExportDefaultDeclaration } from "vue-eslint-parser/ast"
import type { SourceCode } from "../../../../src/types"

const FIXTURES_ROOT = path.join(__dirname, "../../../fixtures/utils/ast/js")

describe("AST for JS.", () => {
    for (const filename of listupInput(FIXTURES_ROOT)) {
        it(filename.slice(FIXTURES_ROOT.length), () => {
            const input = fs.readFileSync(filename, "utf8")
            const outputFile = filename.replace(/input.js$/, "output.json")

            const linter = new Linter()
            let result: any
            linter.defineRule("test", {
                // @ts-expect-error -- ignore
                create(context) {
                    return {
                        ExportDefaultDeclaration(
                            node: ESLintExportDefaultDeclaration,
                        ) {
                            result = toOutput(
                                analyzeJsAST(
                                    node.declaration as never,
                                    context as never,
                                )!,
                                context.getSourceCode() as never,
                            )
                        },
                    }
                },
            })
            const err = linter.verify(input, {
                rules: { test: "error" },
                parser: "espree",
                parserOptions: { ecmaVersion: 2020, sourceType: "module" },
            })
            if (err.length > 0) {
                throw new Error(err[0].message)
            }

            if (!fs.existsSync(outputFile)) {
                fs.writeFileSync(
                    outputFile,
                    `${JSON.stringify(result, null, 4)}\n`,
                    "utf8",
                )
            }

            const output = JSON.parse(fs.readFileSync(outputFile, "utf8"))

            assert.deepStrictEqual(result, output)
        })
    }
})

function* listupInput(rootDir: string): IterableIterator<string> {
    for (const filename of fs.readdirSync(rootDir)) {
        if (filename.startsWith("_")) {
            // ignore
            continue
        }
        const abs = path.join(rootDir, filename)
        if (filename.endsWith("input.js")) {
            yield abs
        } else if (fs.statSync(abs).isDirectory()) {
            yield* listupInput(abs)
        }
    }
}

function toOutput(result: AnalyzedJsAST, sourceCode: SourceCode) {
    const text = sourceCode.text
    return {
        object: JSON.parse(
            JSON.stringify(result.object, (_k, v) =>
                typeof v === "symbol" ? "$UNKNOWN$" : v,
            ),
        ),
        paths: normalizePathData(result.pathData),
    }

    function normalizePathData(pathData: PathData) {
        const key =
            typeof pathData.key === "function"
                ? pathData.key(sourceCode)
                : pathData.key
        const children: Record<string, any> = {}
        pathData.children.forEach((val, key) => {
            if (val == null || typeof val === "symbol") {
                return
            }
            children[key] = normalizePathData(val)
        })
        return {
            key: key ? text.slice(...key) : key,
            children,
        }
    }
}
