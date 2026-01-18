---
"eslint-plugin-json-schema-validator": patch
---

Organize package dependencies:
- Remove `eslint-compat-utils` dependency and use native ESLint 9 APIs instead
- Limit `minimatch` dependency to version 10 only (remove version 9 support)
- Update `toml-eslint-parser` from ^0.12.0 to ^1.0.0
- Update `yaml-eslint-parser` from ^1.0.0 to ^2.0.0
