import { RuleTester } from "eslint"
import rule from "../../../src/rules/no-invalid"
import { loadTestCases } from "../../utils/utils"

const tester = new RuleTester({
    parser: require.resolve("jsonc-eslint-parser"),
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run(
    "no-invalid",
    rule as any,
    loadTestCases(
        "no-invalid",
        {},
        {
            invalid: [
                {
                    filename: ".eslintrc.json",
                    code: '{ "extends": [ 42 ] }',
                    options: [
                        {
                            schemas: [
                                {
                                    fileMatch: [".eslintrc.*"],
                                    schema:
                                        "https://json.schemastore.org/eslintrc",
                                },
                            ],
                        },
                    ],
                    errors: ['"extends[0]" must be string.'],
                },
            ],
        },
    ),
)
