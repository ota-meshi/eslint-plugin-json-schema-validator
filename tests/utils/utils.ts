/* globals process, require -- test */
import fs from "fs";
import path from "path";
import type { RuleTester } from "eslint";
import { Linter } from "eslint";
import * as jsoncESLintParser from "jsonc-eslint-parser";
import * as yamlESLintParser from "yaml-eslint-parser";
import * as tomlESLintParser from "toml-eslint-parser";
import * as vueESLintParser from "vue-eslint-parser";
import semver from "semver";
// eslint-disable-next-line @typescript-eslint/no-require-imports -- tests
import plugin = require("../../src/index");

/**
 * Prevents leading spaces in a multiline template literal from appearing in the resulting string
 */
export function unIndent(strings: readonly string[]): string {
  const templateValue = strings[0];
  const lines = templateValue.split("\n");
  const minLineIndent = getMinIndent(lines);

  return lines.map((line) => line.slice(minLineIndent)).join("\n");
}

/**
 * for `code` and `output`
 */
export function unIndentCodeAndOutput([code]: readonly string[]): (
  args: readonly string[],
) => {
  code: string;
  output: string;
} {
  const codeLines = code.split("\n");
  const codeMinLineIndent = getMinIndent(codeLines);

  return ([output]: readonly string[]) => {
    const outputLines = output.split("\n");
    const minLineIndent = Math.min(
      getMinIndent(outputLines),
      codeMinLineIndent,
    );

    return {
      code: codeLines.map((line) => line.slice(minLineIndent)).join("\n"),
      output: outputLines.map((line) => line.slice(minLineIndent)).join("\n"),
    };
  };
}

/**
 * Get number of minimum indent
 */
function getMinIndent(lines: string[]) {
  const lineIndents = lines
    .filter((line) => line.trim())
    .map((line) => / */u.exec(line)![0].length);
  return Math.min(...lineIndents);
}

/**
 * Load test cases
 */
export function loadTestCases(
  ruleName: string,
  _options?: any,
  additionals?: {
    valid?: (RuleTester.ValidTestCase | string)[];
    invalid?: RuleTester.InvalidTestCase[];
  },
): {
  valid: RuleTester.ValidTestCase[];
  invalid: RuleTester.InvalidTestCase[];
} {
  const validFixtureRoot = path.resolve(
    __dirname,
    `../fixtures/rules/${ruleName}/valid/`,
  );
  const invalidFixtureRoot = path.resolve(
    __dirname,
    `../fixtures/rules/${ruleName}/invalid/`,
  );

  const valid = listupInput(validFixtureRoot).map((inputFile) =>
    getConfig(ruleName, inputFile),
  );

  const invalid = listupInput(invalidFixtureRoot).map((inputFile) => {
    const config = getConfig(ruleName, inputFile);
    const errorFile = inputFile.replace(
      /input\.(?:js|json5?|ya?ml|toml|vue)$/u,
      "errors.json",
    );
    let errors;
    try {
      // writeFixtures(ruleName, inputFile, { force: true })
      errors = fs.readFileSync(errorFile, "utf8");
    } catch (_e) {
      writeFixtures(ruleName, inputFile);
      errors = fs.readFileSync(errorFile, "utf8");
    }
    config.errors = JSON.parse(errors);

    return config;
  });

  if (additionals) {
    if (additionals.valid) {
      valid.push(...additionals.valid);
    }
    if (additionals.invalid) {
      invalid.push(...additionals.invalid);
    }
  }
  for (const test of valid) {
    if (!test.code) {
      throw new Error(`Empty code: ${test.filename}`);
    }
  }
  for (const test of invalid) {
    if (!test.code) {
      throw new Error(`Empty code: ${test.filename}`);
    }
  }
  return {
    valid,
    invalid,
  };
}

function listupInput(rootDir: string) {
  return [...itrListupInput(rootDir)];
}

function* itrListupInput(rootDir: string): IterableIterator<string> {
  for (const filename of fs.readdirSync(rootDir)) {
    if (filename.startsWith("_")) {
      // ignore
      continue;
    }
    const abs = path.join(rootDir, filename);
    if (
      filename.endsWith("input.js") ||
      filename.endsWith("input.json") ||
      filename.endsWith("input.json5") ||
      filename.endsWith("input.yaml") ||
      filename.endsWith("input.yml") ||
      filename.endsWith("input.toml") ||
      filename.endsWith("input.vue")
    ) {
      const requirementsPath = path.join(
        rootDir,
        filename.replace(/input\.\w+$/, "requirements.json"),
      );
      const requirements = fs.existsSync(requirementsPath)
        ? JSON.parse(fs.readFileSync(requirementsPath, "utf8"))
        : {};

      if (
        Object.entries(requirements).some(([pkgName, pkgVersion]) => {
          const version =
            pkgName === "node"
              ? process.version
              : // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports -- test
                require(`${pkgName}/package.json`).version;
          return !semver.satisfies(version, pkgVersion as string);
        })
      ) {
        continue;
      }
      yield abs;
    } else if (fs.statSync(abs).isDirectory()) {
      yield* itrListupInput(abs);
    }
  }
}

function writeFixtures(
  ruleName: string,
  inputFile: string,
  { force }: { force?: boolean } = {},
) {
  const linter = getLinter(ruleName);
  const errorFile = inputFile.replace(
    /input\.(?:js|json5?|ya?ml|toml|vue)$/u,
    "errors.json",
  );

  const config = getConfig(ruleName, inputFile);

  const result = linter.verify(
    config.code,
    {
      rules: {
        [ruleName]: ["error", ...(config.options || [])],
      },
      parser: getParserName(inputFile),
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    config.filename,
  );
  if (force || !fs.existsSync(errorFile)) {
    fs.writeFileSync(
      errorFile,
      `${JSON.stringify(
        result.map((m) => ({
          message: m.message,
          line: m.line,
          column: m.column,
          endLine: m.endLine,
          endColumn: m.endColumn,
        })),
        null,
        4,
      )}\n`,
      "utf8",
    );
  }
}

function getLinter(ruleName: string) {
  const linter = new Linter();
  // @ts-expect-error for test
  linter.defineParser("jsonc-eslint-parser", jsoncESLintParser);
  linter.defineParser("yaml-eslint-parser", yamlESLintParser as any);
  linter.defineParser("toml-eslint-parser", tomlESLintParser as any);
  linter.defineParser("vue-eslint-parser", vueESLintParser as any);
  // @ts-expect-error for test
  linter.defineRule(ruleName, plugin.rules[ruleName]);

  return linter;
}

// eslint-disable-next-line complexity -- ignore
function getConfig(ruleName: string, inputFile: string) {
  const filename = inputFile.slice(inputFile.indexOf(ruleName));
  const code0 = fs.readFileSync(inputFile, "utf8");
  let code, config;
  let configFile: string = inputFile.replace(
    /input\.(?:js|json5?|ya?ml|toml|vue)$/u,
    "config.json",
  );
  const hashComment =
    inputFile.endsWith(".yaml") ||
    inputFile.endsWith(".yml") ||
    inputFile.endsWith(".toml");
  const blockComment =
    (!hashComment && inputFile.endsWith(".json")) ||
    inputFile.endsWith(".json5") ||
    inputFile.endsWith(".js");
  if (!fs.existsSync(configFile)) {
    configFile = path.join(path.dirname(inputFile), "_config.json");
  }
  if (fs.existsSync(configFile)) {
    config = JSON.parse(fs.readFileSync(configFile, "utf8"));
  }
  if (config && typeof config === "object") {
    code = hashComment
      ? `# ${filename}\n${code0}`
      : blockComment
      ? `/* ${filename} */\n${code0}`
      : `<!--${filename}-->\n${code0}`;
    return Object.assign(
      { parser: require.resolve(getParserName(inputFile)) },
      config,
      { code, filename: inputFile },
    );
  }
  // inline config
  const configStr = hashComment
    ? /^#([^\n]+)\n/u.exec(code0)
    : blockComment
    ? /^\/\*(.*?)\*\//u.exec(code0)
    : /^<!--(.*?)-->/u.exec(code0);
  if (!configStr) {
    fs.writeFileSync(inputFile, `/* {} */\n${code0}`, "utf8");
    throw new Error("missing config");
  } else {
    code = hashComment
      ? code0.replace(/^#([^\n]+)\n/u, `# ${filename}\n`)
      : blockComment
      ? code0.replace(/^\/\*(.*?)\*\//u, `# ${filename}\n`)
      : code0.replace(/^<!--(.*?)-->/u, `<!--${filename}-->`);
    try {
      config = configStr ? JSON.parse(configStr[1]) : {};
    } catch (e: any) {
      throw new Error(`${e.message} in @ ${inputFile}`);
    }
  }

  return Object.assign(
    { parser: require.resolve(getParserName(inputFile)) },
    config,
    { code, filename: inputFile },
  );
}

function getParserName(fileName: string): string {
  if (fileName.endsWith(".vue")) {
    return "vue-eslint-parser";
  }
  if (fileName.endsWith(".yaml") || fileName.endsWith(".yml")) {
    return "yaml-eslint-parser";
  }
  if (fileName.endsWith(".toml")) {
    return "toml-eslint-parser";
  }
  if (fileName.endsWith(".js")) {
    return "espree";
  }
  return "jsonc-eslint-parser";
}
