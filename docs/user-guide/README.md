# User Guide

## :cd: Installation

```bash
npm install --save-dev eslint eslint-plugin-json-schema-validator
```

::: tip Requirements
- ESLint v6.0.0 and above
- Node.js v8.10.0 and above
:::

## :book: Usage

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

## :question: FAQ

- TODO
