import type { DefaultTheme, UserConfig } from "vitepress";
import { defineConfig } from "vitepress";
import path from "path";
import { fileURLToPath } from "url";
import eslint4b from "vite-plugin-eslint4b";
import { viteCommonjs } from "./vite-plugin.mjs";

import "./build-system/build.mts";

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
  const schemaPath = "../../lib/utils/schema.js";
  const schema = (await import(
    schemaPath
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
  )) as typeof import("../../src/utils/schema.js");

  // Generate a schema store cache and include it in the bundle.
  schema.loadJson(
    "https://www.schemastore.org/api/json/catalog.json",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any --- ignore
    {} as any,
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any --- ignore
  schema.loadSchema("https://json.schemastore.org/eslintrc.json", {} as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any --- ignore
  schema.loadSchema("https://json.schemastore.org/prettierrc.json", {} as any);
  schema.loadSchema(
    "https://json.schemastore.org/partial-eslint-plugins.json",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any --- ignore
    {} as any,
  );
  const rulesPath = "../../lib/utils/rules.js";
  const { rules } = (await import(rulesPath)) as { rules: RuleModule[] };
  return defineConfig({
    base: "/eslint-plugin-json-schema-validator/",
    title: "eslint-plugin-json-schema-validator",
    outDir: path.join(dirname, "./dist/eslint-plugin-json-schema-validator"),
    description:
      "ESLint plugin that validates data using JSON Schema Validator",
    head: [],

    vite: {
      plugins: [viteCommonjs(), eslint4b()],
      resolve: {
        alias: {
          "vue-eslint-parser": path.join(
            dirname,
            "./build-system/shim/vue-eslint-parser.mjs",
          ),
          module: path.join(dirname, "./shim/module.mjs"),
          fs: path.join(dirname, "./shim/fs.mjs"),
          synckit: path.join(dirname, "./shim/synckit.mjs"),
          "tunnel-agent": path.join(dirname, "./shim/tunnel-agent.mjs"),
          events: path.join(dirname, "./build-system/shim/events.mjs"),
        },
      },
      define: {
        "process.env.NODE_DEBUG": "false",
        "process.platform": JSON.stringify(process.platform),
        "process.version": JSON.stringify(process.version),
      },
      optimizeDeps: {
        // exclude: ["vue-eslint-parser"],
      },
    },

    lastUpdated: true,
    themeConfig: {
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
        { text: "Playground", link: "/playground/" },
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
