import { RuleTester } from "eslint";
import markdown from "@eslint/markdown";
import rule from "../../../src/rules/no-invalid.ts";

/** Schema requiring `ver` to be a string. */
const SCHEMA = {
  type: "object",
  properties: { ver: { type: "string" } },
  additionalProperties: true,
};

/** Base config shared by every Markdown test case. */
function md(frontmatter: "yaml" | "toml" | "json") {
  return {
    plugins: { markdown },
    language: "markdown/commonmark" as const,
    languageOptions: { frontmatter },
  };
}

const OPTIONS = [
  {
    schemas: [{ fileMatch: ["*.md", "**/*.md"], schema: SCHEMA }],
    useSchemastoreCatalog: false,
  },
];

const tester = new RuleTester();

tester.run("no-invalid (markdown frontmatter)", rule as any, {
  valid: [
    {
      filename: "ok.md",
      code: '---\nname: x\nver: "1.0"\n---\n# Title\n',
      options: OPTIONS,
      ...md("yaml"),
    },
    {
      filename: "ok.md",
      code: '+++\nname = "x"\nver = "1.0"\n+++\n# Title\n',
      options: OPTIONS,
      ...md("toml"),
    },
    {
      filename: "ok.md",
      code: '---\n{ "name": "x", "ver": "1.0" }\n---\n# Title\n',
      options: OPTIONS,
      ...md("json"),
    },
    {
      // No frontmatter at all: nothing to validate.
      filename: "ok.md",
      code: "# Title\n\nBody text.\n",
      options: OPTIONS,
      ...md("yaml"),
    },
  ],
  invalid: [
    {
      filename: "bad.md",
      code: "---\nname: x\nver: 9\n---\n# Title\n",
      options: OPTIONS,
      ...md("yaml"),
      errors: [
        {
          message: '"ver" must be string.',
          line: 3,
          column: 1,
          endLine: 3,
          endColumn: 4,
        },
      ],
    },
    {
      filename: "bad.md",
      code: '+++\nname = "x"\nver = 9\n+++\n# Title\n',
      options: OPTIONS,
      ...md("toml"),
      errors: [{ message: '"ver" must be string.', line: 3 }],
    },
    {
      filename: "bad.md",
      code: '---\n{ "name": "x", "ver": 9 }\n---\n# Title\n',
      options: OPTIONS,
      ...md("json"),
      errors: [{ message: '"ver" must be string.', line: 2 }],
    },
  ],
});
