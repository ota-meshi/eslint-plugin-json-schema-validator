# Introduction

<h1 align="center">This plugin is an experimental feature.</h1>

[eslint-plugin-json-schema-validator](https://www.npmjs.com/package/eslint-plugin-json-schema-validator) is ESLint plugin that validates data using JSON Schema Validator.

[![NPM license](https://img.shields.io/npm/l/eslint-plugin-json-schema-validator.svg)](https://www.npmjs.com/package/eslint-plugin-json-schema-validator)
[![NPM version](https://img.shields.io/npm/v/eslint-plugin-json-schema-validator.svg)](https://www.npmjs.com/package/eslint-plugin-json-schema-validator)
[![NPM downloads](https://img.shields.io/badge/dynamic/json.svg?label=downloads&colorB=green&suffix=/day&query=$.downloads&uri=https://api.npmjs.org//downloads/point/last-day/eslint-plugin-json-schema-validator&maxAge=3600)](http://www.npmtrends.com/eslint-plugin-json-schema-validator)
[![NPM downloads](https://img.shields.io/npm/dw/eslint-plugin-json-schema-validator.svg)](http://www.npmtrends.com/eslint-plugin-json-schema-validator)
[![NPM downloads](https://img.shields.io/npm/dm/eslint-plugin-json-schema-validator.svg)](http://www.npmtrends.com/eslint-plugin-json-schema-validator)
[![NPM downloads](https://img.shields.io/npm/dy/eslint-plugin-json-schema-validator.svg)](http://www.npmtrends.com/eslint-plugin-json-schema-validator)
[![NPM downloads](https://img.shields.io/npm/dt/eslint-plugin-json-schema-validator.svg)](http://www.npmtrends.com/eslint-plugin-json-schema-validator)
[![Build Status](https://github.com/ota-meshi/eslint-plugin-json-schema-validator/workflows/CI/badge.svg?branch=main)](https://github.com/ota-meshi/eslint-plugin-json-schema-validator/actions?query=workflow%3ACI)

## :name_badge: Features

This ESLint plugin validates [JSON], [JSONC], [JSON5], [YAML], [TOML] and JavaScript with JSON Schema.

<!--DOCS_IGNORE_START-->

## :book: Documentation

See [documents](https://ota-meshi.github.io/eslint-plugin-json-schema-validator/).

## :cd: Installation

```bash
npm install --save-dev eslint eslint-plugin-jsonc eslint-plugin-json-schema-validator
```

> **Requirements**
>
> - ESLint v6.0.0 and above
> - Node.js v8.10.0 and above

<!--DOCS_IGNORE_END-->

## :book: Usage

<!--USAGE_SECTION_START-->
<!--USAGE_GUIDE_START-->

### Configuration

Use `.eslintrc.*` file to configure rules. See also: [https://eslint.org/docs/user-guide/configuring](https://eslint.org/docs/user-guide/configuring).

Example **.eslintrc.js**:

```js
module.exports = {
  extends: [
    // add more generic rulesets here, such as:
    // 'eslint:recommended',
    'plugin:json-schema-validator/recommended'
  ],
  rules: {
    // override/add rules settings here, such as:
    // 'json-schema-validator/no-invalid': 'error'
  }
}
```

This plugin provides configs:

- `plugin:json-schema-validator/recommended` ... Above, plus rules to prevent errors or unintended behavior.

### Running ESLint from the command line

If you want to run `eslint` from the command line, make sure you include the `.json`, `.json5`, `.yaml`, `.yml` and `.toml` extension using [the `--ext` option](https://eslint.org/docs/user-guide/configuring#specifying-file-extensions-to-lint) or a glob pattern, because ESLint targets only `.js` files by default.

Examples:

```bash
eslint --ext .js,.json,.json5,.yaml,.yml,.toml src
eslint "src/**/*.{js,json,json5,yaml,yml,toml}"
```

## :computer: Editor Integrations

### Visual Studio Code

Use the [dbaeumer.vscode-eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) extension that Microsoft provides officially.

You have to configure the `eslint.validate` option of the extension to check `.json`, `.json5`, `.yaml`, `.yml` and `.toml` files, because the extension targets only `*.js` or `*.jsx` files by default.

Example **.vscode/settings.json**:

```json
{
    "eslint.validate": [
        "javascript",
        "javascriptreact",
        "json",
        "jsonc",
        "json5",
        "yaml",
        "toml"
    ]
}
```

<!--USAGE_GUIDE_END-->
<!--USAGE_SECTION_END-->

## :white_check_mark: Rules

<!--RULES_SECTION_START-->

<!-- The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) automatically fixes problems reported by rules which have a wrench :wrench: below.   -->
The rules with the following star :star: are included in the configs.

<!--RULES_TABLE_START-->

### Rules

| Rule ID | Description | Fixable | RECOMMENDED |
|:--------|:------------|:-------:|:-----------:|
| [json-schema-validator/no-invalid](https://ota-meshi.github.io/eslint-plugin-json-schema-validator/rules/no-invalid.html) | validate object with JSON Schema. |  | :star: |

<!--RULES_TABLE_END-->
<!--RULES_SECTION_END-->

<!--DOCS_IGNORE_START-->

<!--ADVANCED_USAGE_GUIDE_START-->

## :trollface: Advanced Usage

### Settings

Use `.eslintrc.*` file to configure `settings`. See also: [https://eslint.org/docs/user-guide/configuring/configuration-files#adding-shared-settings](https://eslint.org/docs/user-guide/configuring/configuration-files#adding-shared-settings).

Example **.eslintrc.js**:

```js
module.exports = {
  settings: {
    "json-schema-validator": {
      http: {
        getModulePath: "",
        requestOptions: {},
      }
    }
  }
}
```

- `http` ... Settings to resolve schema URLs.
  - `getModulePath` ... Module path to `GET` the URL. The default implementation is [./src/utils/http-client/get-modules/http.ts](https://github.com/ota-meshi/eslint-plugin-json-schema-validator/blob/main/src/utils/http-client/get-modules/http.ts).
  - `requestOptions` ... Options used in the module.

#### Example of `http`

Example of using the `request` module for HTTP requests.

**`./path/to/request-get.js`**:

```js
const request = require("request")

/**
 * GET Method using request module.
 */
module.exports = function get(url, options) {
    return new Promise((resolve, reject) => {
        request.get(url, options, (error, _res, body) => {
            if (error) {
                reject(error)
                return
            }
            resolve(body)
        })
    })
}
```

**.eslintrc.js**:

<!-- eslint-skip -->

```js
module.exports = {
  settings: {
    "json-schema-validator": {
      http: {
        getModulePath: require.resolve("./path/to/request-get.js"),
        requestOptions: {
          // Example of proxy settings.
          proxy: "http://my.proxy.com:8080/"
        },
      }
    }
  }
}
```

<!--ADVANCED_USAGE_GUIDE_END-->

## :beers: Contributing

Welcome contributing!

Please use GitHub's Issues/PRs.

### Development Tools

- `npm test` runs tests and measures coverage.  
- `npm run update` runs in order to update readme and recommended configuration.  

### Working With Rules

This plugin uses [jsonc-eslint-parser](https://github.com/ota-meshi/jsonc-eslint-parser), [yaml-eslint-parser](https://github.com/ota-meshi/yaml-eslint-parser) and [toml-eslint-parser](https://github.com/ota-meshi/toml-eslint-parser) for the parser.

<!--DOCS_IGNORE_END-->

## :couple: Related Packages

- [eslint-plugin-jsonc](https://github.com/ota-meshi/eslint-plugin-jsonc) ... ESLint plugin for JSON, JSON with comments (JSONC) and JSON5.
- [eslint-plugin-yml](https://github.com/ota-meshi/eslint-plugin-yml) ... ESLint plugin for YAML.
- [eslint-plugin-toml](https://github.com/ota-meshi/eslint-plugin-toml) ... ESLint plugin for TOML.
- [jsonc-eslint-parser](https://github.com/ota-meshi/jsonc-eslint-parser) ... JSON, JSONC and JSON5 parser for use with ESLint plugins.
- [yaml-eslint-parser](https://github.com/ota-meshi/yaml-eslint-parser) ... YAML parser for use with ESLint plugins.
- [toml-eslint-parser](https://github.com/ota-meshi/toml-eslint-parser) ... TOML parser for use with ESLint plugins.

## :lock: License

See the [LICENSE](LICENSE) file for license rights and limitations (MIT).

The JSON Schema included in this plugin release is copy from [SchemaStore]. Check [here](./schemastore/README.md) for licenses and details.

[SchemaStore]: https://github.com/SchemaStore/schemastore
[JSON]: https://json.org/
[JSONC]: https://github.com/microsoft/node-jsonc-parser
[JSON5]: https://json5.org/
[YAML]: https://yaml.org/
[TOML]: https://toml.io/
