import { RuleTester } from "eslint"
import rule from "../../../src/rules/no-invalid"
import { loadTestCases } from "../../utils/utils"

const tester = new RuleTester({
    parser: require.resolve("jsonc-eslint-parser"),
    parserOptions: {
        ecmaVersion: 2020,
    },
})

tester.run("no-invalid", rule as any, loadTestCases("no-invalid"))
