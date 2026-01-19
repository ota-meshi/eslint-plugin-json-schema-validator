import type { DefaultTheme, UserConfig } from "vitepress";
import { defineConfig } from "vitepress";
import path from "path";
import { fileURLToPath } from "url";
import { transformerTwoslash } from "@shikijs/vitepress-twoslash";
import { createTwoslasher as createTwoslasherESLint } from "twoslash-eslint";
import type { TwoslashGenericFunction } from "twoslash-protocol";
import * as jsoncParser from "jsonc-eslint-parser";

type RuleModule = {
  meta: { docs: { ruleId: string; ruleName: string }; deprecated?: boolean };
};

const dirname = path.dirname(fileURLToPath(import.meta.url));

function ruleToSidebarItem({
  meta: {
    docs: { ruleId, ruleName },
  },
}: RuleModule): DefaultTheme.SidebarItem {
  return {
    text: ruleId,
    link: `/rules/${ruleName}`,
  };
}

export default async (): Promise<UserConfig<DefaultTheme.Config>> => {
  // Import from lib (built version) to avoid TypeScript/synckit issues
  const { default: plugin } = await import("../../lib/index.mjs");
  const rules = Object.values(plugin.rules) as unknown as RuleModule[];

  return defineConfig({
    base: "/eslint-plugin-json-schema-validator/",
    title: "eslint-plugin-json-schema-validator",
    outDir: path.join(dirname, "./dist/eslint-plugin-json-schema-validator"),
    description:
      "ESLint plugin that validates data using JSON Schema Validator",
    head: [],

    markdown: {
      codeTransformers: [
        transformerTwoslash({
          explicitTrigger: false,
          langs: ["json", "json5", "jsonc", "yaml", "yml", "toml", "js"],
          filter(lang, code) {
            if (
              lang.startsWith("json") ||
              lang.startsWith("yaml") ||
              lang === "yml" ||
              lang === "toml" ||
              lang === "js"
            ) {
              return /\beslint\s/u.test(code);
            }
            return false;
          },
          errorRendering: "hover",
          twoslasher: ((): TwoslashGenericFunction => {
            const twoslasher = createTwoslasherESLint({
              eslintConfig: [
                {
                  files: [
                    "*",
                    "**/*",
                    ...[
                      "json",
                      "json5",
                      "jsonc",
                      "yaml",
                      "yml",
                      "toml",
                      "js",
                    ].flatMap((ext) => [`*.${ext}`, `**/*.${ext}`]),
                  ],
                  plugins: {
                    "json-schema-validator": plugin,
                  },
                },
                {
                  files: [
                    ...["json", "json5", "jsonc"].flatMap((ext) => [
                      `*.${ext}`,
                      `**/*.${ext}`,
                    ]),
                  ],
                  languageOptions: {
                    parser: jsoncParser,
                  },
                },
              ],
            });
            return (code: string, filename: string | undefined) => {
              // Try to extract defined filename from the code block
              const definedFilename = /File name is "([^"]*)"/u.exec(code)?.[1];
              return twoslasher(code, definedFilename ?? filename);
            };
          })(),
        }) as never,
      ],
    },

    lastUpdated: true,
    themeConfig: {
      siteTitle: "eslint-plugin-<wbr>json-schema-validator",
      search: {
        provider: "local",
        options: {
          detailedView: true,
        },
      },
      editLink: {
        pattern:
          "https://github.com/ota-meshi/eslint-plugin-json-schema-validator/edit/main/docs/:path",
      },
      nav: [
        { text: "Introduction", link: "/" },
        { text: "User Guide", link: "/user-guide/" },
        { text: "Rules", link: "/rules/" },
        {
          text: "Playground",
          link: "https://eslint-online-playground.netlify.app/#eslint-plugin-json-schema-validator",
        },
      ],
      socialLinks: [
        {
          icon: "github",
          link: "https://github.com/ota-meshi/eslint-plugin-json-schema-validator",
        },
      ],
      sidebar: {
        "/rules/": [
          {
            text: "Rules",
            items: [{ text: "Available Rules", link: "/rules/" }],
          },
          {
            text: "JSON Schema Validator Rules",
            collapsed: false,
            items: rules
              .filter((rule) => !rule.meta.deprecated)
              .map(ruleToSidebarItem),
          },

          // Rules in no category.
          ...(rules.some((rule) => rule.meta.deprecated)
            ? [
                {
                  text: "Deprecated",
                  collapsed: false,
                  items: rules
                    .filter((rule) => rule.meta.deprecated)
                    .map(ruleToSidebarItem),
                },
              ]
            : []),
        ],
        "/": [
          {
            text: "Guide",
            items: [
              { text: "Introduction", link: "/" },
              { text: "User Guide", link: "/user-guide/" },
              { text: "Rules", link: "/rules/" },
            ],
          },
        ],
      },
    },
  });
};
