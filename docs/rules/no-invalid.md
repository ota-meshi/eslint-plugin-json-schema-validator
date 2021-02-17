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

## :books: Further reading

- [JSON Schema](https://json-schema.org/)
- [JSON Schema Store](https://www.schemastore.org/json/)

## Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-json-schema-validator/blob/main/src/rules/no-invalid.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-json-schema-validator/blob/main/tests/src/rules/no-invalid.js)
