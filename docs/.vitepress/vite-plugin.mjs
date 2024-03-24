import path from "path";
import { fileURLToPath } from "url";
import esbuild from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pluginRoot = path.join(__dirname, "../..");
const srcRoot = path.join(pluginRoot, "src");
const fakeRequirePath = path.join(
  pluginRoot,
  "docs/.vitepress/shim/require-from-cache.mjs",
);

export function viteCommonjs() {
  return {
    name: "vite-plugin-cjs-to-esm",
    apply: () => true,
    transform(code, id) {
      if (!id.startsWith(srcRoot)) {
        return undefined;
      }
      const base = transformRequire(code);
      try {
        const transformed = esbuild.transformSync(base, {
          format: "esm",
        });
        return transformed.code;
      } catch (e) {
        console.error(`Transform error. base code:\n${base}`, e);
      }
      return undefined;
    },
  };
}

/**
 * Transform `require()` to `import`
 */
function transformRequire(code) {
  if (!code.includes("require") && !code.includes("__dirname")) {
    return code;
  }
  const modules = new Map();
  const replaced = code
    .replace(
      /(?<comment>\/\/[^\n\r]*|\/\*[\s\S]*?\*\/)|\brequire\s*\(\s*(?<moduleString>["'].*?["'])\s*\)/gu,
      (match, comment, moduleString) => {
        if (comment) {
          return match;
        }

        let id = generateId(moduleString);
        return id;
      },
    )
    .replace(
      /(?<comment>\/\/[^\n\r]*|\/\*[\s\S]*?\*\/)|\brequire\s*\(/gu,
      (match, comment, _moduleString) => {
        if (comment) {
          return match;
        }

        let id = generateId(JSON.stringify(fakeRequirePath));
        return `${id}(`;
      },
    )
    .replace(
      /(?<comment>\/\/[^\n\r]*|\/\*[\s\S]*?\*\/)|\brequire\s*\.\s*resolve\s*\(\s*(?<moduleString>["'].*?["'])\s*\)/gu,
      (match, comment, _moduleString) => {
        if (comment) {
          return match;
        }
        return `'??unknown?? require.resolve(' + ${JSON.stringify(_moduleString)} + ')'`;
      },
    )
    .replace(
      /(?<comment>\/\/[^\n\r]*|\/\*[\s\S]*?\*\/)|\b__dirname/gu,
      (match, comment, _moduleString) => {
        if (comment) {
          return match;
        }
        return `'/'/*__dirname*/`;
      },
    );

  function generateId(moduleString) {
    let id = `__${moduleString.replace(/[^\w$]+/gu, "_")}${Math.random()
      .toString(32)
      .substring(2)}`;
    while (code.includes(id) || modules.has(id)) {
      id += Math.random().toString(32).substring(2);
    }
    modules.set(id, moduleString);
    return id;
  }

  return `${[...modules]
    .map(
      ([id, moduleString]) =>
        `import * as __temp_${id} from ${moduleString}; const ${id} = __temp_${id}.default || __temp_${id};`,
    )
    .join("")};${replaced}`;
}
