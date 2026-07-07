---
"eslint-plugin-json-schema-validator": minor
---

feat: add configurable schemastore cache location and TTL

New `settings["json-schema-validator"].cache` options:

- `path` — where cached schemas are stored (relative to cwd, or absolute).
- `ttl` — how long before a cached schema is refetched (ms number or a
  duration string like `"12h"` / `"1d"`).

The default cache location has moved out of `node_modules` into the OS user
cache directory, so it now persists across runs (fixes the Docker use case in
#180). Existing setups keep the 1-day TTL; the only effect of the moved default
is a one-time refetch of schemas.
