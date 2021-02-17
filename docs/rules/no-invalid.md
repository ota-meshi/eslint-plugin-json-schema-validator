---
pageClass: "rule-details"
sidebarDepth: 0
title: "json-schema-validator/no-invalid"
description: "validate object with JSON Schema."
---
# json-schema-validator/no-invalid

> validate object with JSON Schema.

- :gear: This rule is included in `"plugin:json-schema-validator/recommended"`.

## :book: Rule Details

This rule validates the file with JSON Schema and reports errors.

<eslint-code-block file-name=".eslintrc.json">

<!-- eslint-skip -->

```json5
// File name is ".eslintrc.json"
/* eslint json-schema-validator/no-invalid: 'error' */
{
    "overrides": [
        {
            "files": ["good"],
            /* ✓ GOOD */
            "extends": ["foo"]
        },
        {
            "files": ["bad"],
            /* ✗ BAD */
            "extends": [42]
        }
    ]
}
```

</eslint-code-block>

## :wrench: Options

```json5
{
    "json-schema-validator/no-invalid": [
        "error",
        {
            "schemas": [
                {
                    "fileMatch": [".eslintrc.json"],
                    "schema": {/* JSON Schema Definition */} // or string
                }
            ],
            "useSchemastoreCatalog": true
        }
    ]
}
```

- `schema` ... Define an array of any JSON Schema.
  - `fileMatch` ... A list of known file names (or globs) that match the schema.
  - `schema` ... An object that defines a JSON schema. Or the path of the JSON schema file or URL.
- `"useSchemastoreCatalog"` ... If `true`, it will automatically configure some schemas defined in [https://www.schemastore.org/api/json/catalog.json](https://www.schemastore.org/api/json/catalog.json). Default `true`

### Using with `.vue`

This rule supports [`.vue` custom blocks](https://vue-loader.vuejs.org/guide/custom-blocks.html).

Like:

```vue
<i18n>
{
    "en": {
        "hello": "Hello"
    }
}
</i18n>
```

To match a custom block, use a glob like this:

```json5
{
    // If you want to match the <i18n> block.
    "fileMatch": ["**/*blockType=i18n*"],
    "schema": { "type": "object" /* JSON Schema Definition */ }
}
```

The following custom blocks will try to test if it matches with the virtual filenames.

<!-- eslint-skip -->

```vue
<i18n lang="yaml">
# path/to/foo.vue/i18n.yaml?vue&type=custom&blockType=i18n&lang=yaml
foo: bar
</i18n>

<i18n lang="json">
// path/to/foo.vue/i18n.json?vue&type=custom&blockType=i18n&lang=json
{ "foo": "bar" }
</i18n>

<i18n>
// path/to/foo.vue/i18n.json?vue&type=custom&blockType=i18n
{ "foo": "bar"}
</i18n>
```

## :books: Further reading

- [JSON Schema](https://json-schema.org/)
- [JSON Schema Store](https://www.schemastore.org/json/)

## Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-json-schema-validator/blob/main/src/rules/no-invalid.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-json-schema-validator/blob/main/tests/src/rules/no-invalid.js)
