---
"eslint-plugin-json-schema-validator": major
---

Validate each document in a multi-document YAML file independently against the schema, instead of validating the array of all documents as a whole ([#344](https://github.com/ota-meshi/eslint-plugin-json-schema-validator/issues/344)). This matches editor behavior (yaml-language-server). Each document may declare its own schema via a modeline or root `$schema`, with carry-forward to later documents, and `$schema=none` disables validation for a document.

BREAKING CHANGE: multi-document YAML files are no longer validated as a single array of documents. A schema that previously described the array of documents must be changed to describe a single document.
