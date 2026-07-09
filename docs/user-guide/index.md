# User Guide

## :cd: Installation

```bash
npm install --save-dev eslint eslint-plugin-json-schema-validator
```

::: tip Requirements

- ESLint v9.38.0 and above
- Node.js v20.19.0 or higher (in the 20.x line), v22.13.0 or higher (in the 22.x line), or v24.0.0 and above

:::

## :book: Usage

<!--USAGE_GUIDE_START-->

### Configuration

Use `eslint.config.js` file to configure rules. See also: <https://eslint.org/docs/latest/use/configure/configuration-files-new>.

Example **eslint.config.js**:

```js
import eslintPluginJsonSchemaValidator from "eslint-plugin-json-schema-validator";
export default [
  // add more generic rule sets here, such as:
  // js.configs.recommended,
  ...eslintPluginJsonSchemaValidator.configs.recommended,
  {
    rules: {
      // override/add rules settings here, such as:
      // 'json-schema-validator/no-invalid': 'warn'
    },
  },
];
```

This plugin provides configs:

- `*.configs.base` ... Configuration to enable correct JSON, YAML and TOML parsing.
- `*.configs.recommended` ... Above, plus rule to validate with JSON Schema.

See [the rule list](../rules/index.md) to get the `rules` that this plugin provides.

For backward compatibility, the `flat/` prefix can still be used:

- `*.configs["flat/base"]` is an alias for `*.configs.base`
- `*.configs["flat/recommended"]` is an alias for `*.configs.recommended`

### Running ESLint from the command line

If you want to run `eslint` from the command line, make sure you include the `.json`, `.jsonc`, `.json5`, `.yaml`, `.yml` and `.toml` extension using [the `--ext` option](https://eslint.org/docs/user-guide/configuring#specifying-file-extensions-to-lint) or a glob pattern, because ESLint targets only `.js` files by default.

Examples:

```bash
eslint --ext .js,.json,.jsonc,.json5,.yaml,.yml,.toml src
eslint "src/**/*.{js,json,jsonc,json5,yaml,yml,toml}"
```

## :computer: Editor Integrations

### Visual Studio Code

Use the [dbaeumer.vscode-eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) extension that Microsoft provides officially.

You have to configure the `eslint.validate` option of the extension to check `.json`, `.jsonc`, `.json5`, `.yaml`, `.yml` and `.toml` files, because the extension targets only `*.js` or `*.jsx` files by default.

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
      },
    },
  },
};
```

- `http` ... Settings to resolve schema URLs.
  - `getModulePath` ... Module path to `GET` the URL. The default implementation is [./src/utils/http-client/get-modules/http.ts](https://github.com/ota-meshi/eslint-plugin-json-schema-validator/blob/main/src/utils/http-client/get-modules/http.ts).
  - `requestOptions` ... Options used in the module.

#### Example of `http`

Example of using the `request` module for HTTP requests.

**`./path/to/request-get.js`**:

```js
const request = require("request");

/**
 * GET Method using request module.
 */
module.exports = function get(url, options) {
  return new Promise((resolve, reject) => {
    request.get(url, options, (error, _res, body) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(body);
    });
  });
};
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
          proxy: "http://my.proxy.com:8080/",
        },
      },
    },
  },
};
```

### YAML merge keys

When validating YAML, this plugin resolves [merge keys (`<<`)](https://yaml.org/type/merge.html) before checking the data against the schema, so a mapping that merges in an anchored mapping is validated as the final merged object rather than reporting `<<` itself as an unexpected property.

Merge keys are a YAML 1.1 feature, so they are only resolved for documents parsed as YAML 1.1. [`yaml-eslint-parser`](https://github.com/ota-meshi/yaml-eslint-parser) parses documents as YAML 1.2 by default, where `<<` is an ordinary key and is left as-is. A document is treated as YAML 1.1 when it begins with a `%YAML 1.1` directive or is parsed with the `defaultYAMLVersion` parser option set to `"1.1"`.

To resolve merge keys across files without adding a directive to each one, set `defaultYAMLVersion` for the relevant files in your configuration:

```js
import eslintPluginJsonSchemaValidator from "eslint-plugin-json-schema-validator";
export default [
  ...eslintPluginJsonSchemaValidator.configs.recommended,
  {
    files: ["**/.gitlab-ci.yml", "**/config/**/*.yaml"],
    languageOptions: {
      parserOptions: {
        defaultYAMLVersion: "1.1",
      },
    },
  },
];
```

This parses the matched files as YAML 1.1 in full, so the YAML 1.1 scalar rules apply as well (for example, `yes` and `on` are parsed as booleans).

A schema violation on a property introduced by a merge is reported on the `<<` line — merged properties have no location of their own in the target mapping — with a `(from merge key)` hint appended to the message.

<!--ADVANCED_USAGE_GUIDE_END-->

## :question: FAQ

- TODO
