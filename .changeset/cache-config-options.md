---
"eslint-plugin-json-schema-validator": minor
---

feat: add configurable schemastore cache location and TTL

New `settings["json-schema-validator"].cache` options:

- `path` — where cached schemas are stored (relative to cwd, or absolute).
- `ttl` — how long before a cached schema is refetched (ms number or a
  duration string like `"12h"` / `"1d"`).
