import catalog from "../../../.cached_schemastore/json.schemastore.org/api/json/catalog.json";
import eslintrc from "../../../.cached_schemastore/json.schemastore.org/eslintrc.json";
import partialEslintPlugins from "../../../.cached_schemastore/json.schemastore.org/partial-eslint-plugins.json";
import prettierrc from "../../../.cached_schemastore/json.schemastore.org/prettierrc.json";

/**
 * @param {string} p
 */
export default function fakeRequire(p) {
  if (
    p.endsWith(".cached_schemastore/json.schemastore.org/api/json/catalog.json")
  ) {
    return { ...catalog, timestamp: Infinity };
  }
  if (p.endsWith(".cached_schemastore/json.schemastore.org/eslintrc.json")) {
    return { ...eslintrc, timestamp: Infinity };
  }
  if (
    p.endsWith(
      ".cached_schemastore/json.schemastore.org/partial-eslint-plugins.json",
    )
  ) {
    return { ...partialEslintPlugins, timestamp: Infinity };
  }
  if (p.endsWith(".cached_schemastore/json.schemastore.org/prettierrc.json")) {
    return { ...prettierrc, timestamp: Infinity };
  }
  console.log(`unknown:${p}`);
  return {};
}

fakeRequire.resolve = () => "";
