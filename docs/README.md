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

## :book: Usage

See [User Guide](./user-guide/README.md).

## :white_check_mark: Rules

See [Available Rules](./rules/README.md).

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
