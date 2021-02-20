# Introduction

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

This ESLint plugin validates [JSON], [JSONC], [JSON5], [YAML], [TOML], **JavaScript** and [Vue Custom Blocks] with JSON Schema.

You can check on the [Online DEMO](https://ota-meshi.github.io/eslint-plugin-json-schema-validator/playground/) that uses [JavaScript](https://ota-meshi.github.io/eslint-plugin-json-schema-validator/playground/#eJxtUMtqwzAQ/JVFvYVIhtKToIf+QH8gysGx17aCveus1kkg5N/rJ02hKyHQaDQ7Ow9TxRa/8w6NNw5TG0mlcOdk9qbgckKzHSw4nBOTTUWDXW6veRvLXFkyYhtpvno4BIK5gkERlmD2v0ij2iefZZOMW2TSKICOpc621sHMH47zaS18nXhQ4F4jU/KwabDmtsPURFdHbYaTi7xK2L4d6kj2f7MytJheLLtGu/ZtlQ+0ywJ1XI4kh/eeRRN8wmMZAe+KVI4eDvDxDsd1MKSr3xhTnYRvCcWDyoAL/Fypc+8/ZLxMy4/Z3HKhl7AAkkosdHriqlpDgWegcZvnD5npj+8=), [JSON](https://ota-meshi.github.io/eslint-plugin-json-schema-validator/playground/#eJxtUF1vgzAM/CtR9lY1RJr6xNt+x9IHPlzIBDazTTsJ8d9LgHaVtiSylDvd2efJVlSDza0/GJAuopovIXRStdAX7lp0sS6U2CO5iOs3N58BzXqCBWbiYI+/SKs6SO59ssk2G1kMICNu/NaCq2BXwXmtzpmPkkY1NGgklNw8PEgL14O0MWuitmOZRdot3NCNTUT3/7A8diAvI2et9t3bbh/w4ANO28RLgh8FrCXYJZc5vZvz8cngNaHTI1vCSqabACdceYSNmp+StfEfEXynm+BgbwXjy74SLcqx0o2my2XfjZkDLs/Od5odhuU=), [YAML](https://ota-meshi.github.io/eslint-plugin-json-schema-validator/playground/#eJxtjkFuhDAMRa9ime0kSKOu2PUCvUDTRQADqYJNHTPTqurdO8CM1EXl1X/f3/7fOKRML3EmbNBTyYlNO/8V54wn7KTfeAWHAe9F2JVuojm6S8ypjyZas7jEu2zglVRFTxBwMltKU9dbxh+ZctsmLzrWj0cB3wJX4Bw8t7IayGJJuDTwSItFN1OZkh+TTWvrk9zDbsnrmNj930nXTOVPMz/ZnKv7+cD0acR9aQIDOHg63whfdtWqXAtpwAZMVwq8X9qtgPSxzeYFvEblgAcvpqmzg8swbBh/fgE9uHsQ) and [TOML](https://ota-meshi.github.io/eslint-plugin-json-schema-validator/playground/#eJxtjjFPxDAMhf9KlK6XdOCmSgyIHYnpBsKQtr7GKImr2GE58d/xcSAY2Pze82e/iz1jhqdYwE7W7w1EEFpbvFDJ9mAXWq/JYIAzVjFvTNXxkqBE9x4zrlGojZUc1i85mRfFqR1MsElk52kcr4y/Mazb4Klt4++rYF9DHYxz5mGmLoZ2Qao8mR+eJLoCnNBvKKnPHmm81XF77htW93+r1jPwn24+ScnD9/lQpUXUI9sjlRLNvRYGvgtWgzifcJWk3jFUhoI6nWNmUKVAhudOAmpK6+rZj0/iJXYT).

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

- `plugin:json-schema-validator/base` ... Configuration to enable correct JSON, YAML and TOML parsing.
- `plugin:json-schema-validator/recommended` ... Above, plus rule to validate with JSON Schema.

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

## :zap: Advanced Usage

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
- [eslint-plugin-vue](https://eslint.vuejs.org/) ... Official ESLint plugin for Vue.js.
- [jsonc-eslint-parser](https://github.com/ota-meshi/jsonc-eslint-parser) ... JSON, JSONC and JSON5 parser for use with ESLint plugins.
- [yaml-eslint-parser](https://github.com/ota-meshi/yaml-eslint-parser) ... YAML parser for use with ESLint plugins.
- [toml-eslint-parser](https://github.com/ota-meshi/toml-eslint-parser) ... TOML parser for use with ESLint plugins.
- [vue-eslint-parser](https://github.com/vuejs/vue-eslint-parser) ... The ESLint custom parser for `.vue` files.

## :lock: License

See the [LICENSE](LICENSE) file for license rights and limitations (MIT).

The JSON Schema included in this plugin release is copy from [SchemaStore]. Check [here](https://github.com/ota-meshi/eslint-plugin-json-schema-validator/blob/main/schemastore/README.md) for licenses and details.

[SchemaStore]: https://github.com/SchemaStore/schemastore
[JSON]: https://json.org/
[JSONC]: https://github.com/microsoft/node-jsonc-parser
[JSON5]: https://json5.org/
[YAML]: https://yaml.org/
[TOML]: https://toml.io/
[Vue Custom Blocks]: https://vue-loader.vuejs.org/guide/custom-blocks.html
