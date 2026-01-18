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
  // Hardcode rules to avoid importing the plugin which has Node dependencies
  const rules: RuleModule[] = [
    {
      meta: {
        docs: {
          ruleId: "json-schema-validator/no-invalid",
          ruleName: "no-invalid",
        },
        deprecated: false,
      },
    } as RuleModule,
  ];

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
      siteTitle: "eslint-plugin-\njson-schema-validator",
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
