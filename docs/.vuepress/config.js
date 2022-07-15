const path = require("path");
// eslint-disable-next-line node/no-missing-require -- no build
const { rules } = require("../../lib/utils/rules");
// eslint-disable-next-line node/no-missing-require -- no build
const schema = require("../../lib/utils/schema");
// Generate a schema store cache and include it in the bundle.
schema.loadJson("https://www.schemastore.org/api/json/catalog.json", {});
schema.loadSchema("https://json.schemastore.org/eslintrc.json", {});
schema.loadSchema("https://json.schemastore.org/prettierrc.json", {});

function ruleToLink({
  meta: {
    docs: { ruleId, ruleName },
  },
}) {
  return [`/rules/${ruleName}`, ruleId];
}

module.exports = {
  base: "/eslint-plugin-json-schema-validator/",
  title: "eslint-plugin-json-schema-validator",
  description: "ESLint plugin that validates data using JSON Schema Validator",
  serviceWorker: true,
  // evergreen: true,
  configureWebpack(_config, _isServer) {
    return {
      resolve: {
        alias: {
          module: require.resolve("./shim/module"),
          fs: require.resolve("./shim/fs"),
          http: require.resolve("./shim/empty"),
          https: require.resolve("./shim/empty"),
          "json-schema-migrate": require.resolve("./shim/empty"),
          eslint: path.resolve(__dirname, "./shim/eslint"),
          ajv: path.resolve(
            require.resolve("eslint/package.json"),
            "../node_modules/ajv"
          ),
          [path.resolve(__dirname, "../../lib/utils/ajv")]: path.resolve(
            __dirname,
            "../../node_modules/ajv"
          ),
          synckit: require.resolve("./shim/synckit"),
          // Adjust the yaml path as it gets confusing.
          yaml$: path.resolve(
            __dirname,
            "../../node_modules/yaml/dist/index.js"
          ),
        },
      },
    };
  },
  chainWebpack(config) {
    // In order to parse with webpack 4, the yaml package needs to be transpiled by babel.
    const jsRule = config.module.rule("js");
    const original = jsRule.exclude.values();
    jsRule.exclude
      .clear()
      .add((filepath) => {
        if (/node_modules\/yaml\//u.test(filepath)) {
          return false;
        }
        for (const fn of original) {
          if (fn(filepath)) {
            return true;
          }
        }
        return false;
      })
      .end()
      .use("babel-loader");
  },

  // head: [["link", { rel: "icon", type: "image/png", href: "/logo.png" }]],
  themeConfig: {
    // logo: "/logo.svg",
    repo: "ota-meshi/eslint-plugin-json-schema-validator",
    docsRepo: "ota-meshi/eslint-plugin-json-schema-validator",
    docsDir: "docs",
    docsBranch: "main",
    editLinks: true,
    lastUpdated: true,
    serviceWorker: {
      updatePopup: true,
    },

    nav: [
      { text: "Introduction", link: "/" },
      { text: "User Guide", link: "/user-guide/" },
      { text: "Rules", link: "/rules/" },
      { text: "Playground", link: "/playground/" },
    ],

    sidebar: {
      "/rules/": [
        "/rules/",
        {
          title: "Rules",
          collapsable: false,
          children: rules
            .filter((rule) => !rule.meta.deprecated)
            .map(ruleToLink),
        },
        // Rules in no category.
        ...(rules.some((rule) => rule.meta.deprecated)
          ? [
              {
                title: "Deprecated",
                collapsable: false,
                children: rules
                  .filter((rule) => rule.meta.deprecated)
                  .map(ruleToLink),
              },
            ]
          : []),
      ],
      "/": ["/", "/user-guide/", "/rules/", "/playground/"],
    },
  },
};
