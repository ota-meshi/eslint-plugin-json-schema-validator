import path from "path";
import fs from "fs";
import cp from "child_process";
const logger = console;

// main
((ruleId) => {
  if (ruleId == null) {
    logger.error("Usage: npm run new <RuleID>");
    process.exitCode = 1;
    return;
  }
  if (!/^[\w-]+$/u.test(ruleId)) {
    logger.error("Invalid RuleID '%s'.", ruleId);
    process.exitCode = 1;
    return;
  }

  const ruleFile = path.resolve(__dirname, `../src/rules/${ruleId}.ts`);
  const testFile = path.resolve(__dirname, `../tests/src/rules/${ruleId}.ts`);
  const fixturesRoot = path.resolve(
    __dirname,
    `../tests/fixtures/rules/${ruleId}/`
  );
  const docFile = path.resolve(__dirname, `../docs/rules/${ruleId}.md`);
  try {
    fs.mkdirSync(fixturesRoot);
    fs.mkdirSync(path.resolve(fixturesRoot, "valid"));
    fs.mkdirSync(path.resolve(fixturesRoot, "invalid"));
  } catch {
    // ignore
  }

  fs.writeFileSync(
    ruleFile,
    `
import type { AST as JSON } from "jsonc-eslint-parser"
import type { AST as YAML } from "yaml-eslint-parser"
import type { AST as TOML } from "toml-eslint-parser"
import { createRule } from "../utils"

export default createRule("${ruleId}", {
    meta: {
        docs: {
            description: "...",
            categories: ["..."],
        },
        fixable: undefined,
        schema: [],
        messages: {},
        type: 'suggestion',
    },
    create(context) {
        if (!context.parserServices.isJSON && !context.parserServices.isYAML && !context.parserServices.isTOML) {
            return {}
        }
        const sourceCode = context.getSourceCode()

        return {

        }
    },
})
`
  );
  fs.writeFileSync(
    testFile,
    `import { RuleTester } from "eslint"
import rule from "../../../src/rules/${ruleId}"
import { loadTestCases } from "../../utils/utils"

const tester = new RuleTester({
    parser: require.resolve("jsonc-eslint-parser"),
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module"
    },
})

tester.run("${ruleId}", rule as any, loadTestCases("${ruleId}"))
`
  );
  fs.writeFileSync(
    docFile,
    `#  (json-schema-validator/${ruleId})

> description

## :book: Rule Details

This rule reports ???.


<eslint-code-block fix>

<!-- eslint-skip -->

\`\`\`json5
/* eslint json-schema-validator/${ruleId}: 'error' */
{
    /* ✓ GOOD */
    "good": "foo",

    /* ✗ BAD */
    "bad": "bar",
}
\`\`\`

</eslint-code-block>

## :wrench: Options

Nothing.

\`\`\`json5
{
  "json-schema-validator/${ruleId}": [
    "error",
    opt
  ]
}
\`\`\`

Same as [${ruleId}] rule option. See [here](https://eslint.org/docs/rules/${ruleId}#options) for details.

- 

## :books: Further reading

- 

## :couple: Related rules

- [${ruleId}]

[${ruleId}]: https://eslint.org/docs/rules/${ruleId}

`
  );

  cp.execSync(`code "${ruleFile}"`);
  cp.execSync(`code "${testFile}"`);
  cp.execSync(`code "${docFile}"`);
})(process.argv[2]);
