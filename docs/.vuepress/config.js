const path = require("path")
// eslint-disable-next-line node/no-missing-require -- no build
const { rules } = require("../../lib/utils/rules")

function ruleToLink({
    meta: {
        docs: { ruleId, ruleName },
    },
}) {
    return [`/rules/${ruleName}`, ruleId]
}

module.exports = {
    base: "/eslint-plugin-json-schema-validator/",
    title: "eslint-plugin-json-schema-validator",
    description:
        "ESLint plugin that validates data using JSON Schema Validator",
    serviceWorker: true,
    evergreen: true,
    configureWebpack(_config, _isServer) {
        return {
            resolve: {
                alias: {
                    module: require.resolve("./shim/module"),
                    eslint: path.resolve(__dirname, "./shim/eslint"),
                },
            },
        }
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
}
