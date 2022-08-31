import path from "path";
import fs from "fs";
import type { RuleContext } from "../types";
import { syncGet, get } from "./http-client";
import debugBuilder from "debug";
import type { SchemaObject } from "./types";
import { draft7 as migrateToDraft7 } from "json-schema-migrate";
const debug = debugBuilder("eslint-plugin-json-schema-validator:utils-schema");

const TTL = 1000 * 60 * 60 * 24;
const RELOADING = new Set<string>();

/**
 * Load schema data
 */
export function loadSchema(
  schemaPath: string,
  context: RuleContext
): null | SchemaObject {
  return loadJsonInternal(schemaPath, context, (schema) => {
    migrateToDraft7(schema as SchemaObject);
    return schema;
  });
}
/**
 * Load json data
 */
export function loadJson<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
  T = any
>(jsonPath: string, context: RuleContext): null | T {
  return loadJsonInternal(jsonPath, context);
}

/**
 * Load json data. Can insert a data editing process.
 */
function loadJsonInternal<T>(
  jsonPath: string,
  context: RuleContext,
  edit?: (json: unknown) => unknown
): null | T {
  if (jsonPath.startsWith("http://") || jsonPath.startsWith("https://")) {
    return loadJsonFromURL(jsonPath, context, edit);
  }
  const json = fs.readFileSync(
    path.resolve(getCwd(context), jsonPath),
    "utf-8"
  );
  const data = JSON.parse(json);
  return edit ? edit(data) : data;
}

/**
 * Load schema data from url
 */
function loadJsonFromURL<T>(
  jsonPath: string,
  context: RuleContext,
  edit?: (json: unknown) => unknown
): null | T {
  let jsonFileName = jsonPath.replace(/^https?:\/\//u, "");
  if (!jsonFileName.endsWith(".json")) {
    jsonFileName = `${jsonFileName}.json`;
  }
  const jsonFilePath = path.join(
    __dirname,
    `../../.cached_schemastore/${jsonFileName}`
  );

  const options = context.settings?.["json-schema-validator"]?.http;

  const httpRequestOptions = options?.requestOptions ?? {};
  const httpGetModulePath = resolvePath(options?.getModulePath, context);

  makeDirs(path.dirname(jsonFilePath));

  let data, timestamp;
  try {
    ({ data, timestamp } =
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports -- ignore
      require(`../../.cached_schemastore/${jsonFileName}`) as {
        data: SchemaObject;
        timestamp: number;
      });
  } catch {
    // ignore
  }

  if (data != null && typeof timestamp === "number") {
    if (timestamp + TTL < Date.now()) {
      // Reload!
      // However, the data can actually be used the next time access it.
      if (!RELOADING.has(jsonFilePath)) {
        RELOADING.add(jsonFilePath);
        // eslint-disable-next-line @typescript-eslint/no-floating-promises -- ignore
        get(jsonPath, httpRequestOptions, httpGetModulePath).then((json) => {
          postProcess(jsonPath, jsonFilePath, json, context, edit);
          RELOADING.delete(jsonFilePath);
        });
      }
    }
    return data as never;
  }

  let json: string;
  try {
    json = syncGet(jsonPath, httpRequestOptions, httpGetModulePath);
  } catch (e) {
    debug((e as Error).message);
    // context.report({
    //     loc: { line: 1, column: 0 },
    //     message: `Could not be resolved: "${schemaPath}"`,
    // })
    return null;
  }

  return postProcess(jsonPath, jsonFilePath, json, context, edit);
}

/**
 * Post process
 */
function postProcess<T>(
  schemaUrl: string,
  jsonFilePath: string,
  json: string,
  context: RuleContext,
  edit: ((json: unknown) => unknown) | undefined
): T | null {
  let data;
  try {
    data = JSON.parse(json);
  } catch {
    context.report({
      loc: { line: 1, column: 0 },
      message: `Could not be parsed JSON: "${schemaUrl}"`,
    });
    return null;
  }

  if (edit) {
    data = edit(data);
  }

  fs.writeFileSync(
    jsonFilePath,
    schemaStringify({
      data,
      timestamp: Date.now(),
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports -- ignore
      v: require("../../package.json").version,
    })
  );
  delete require.cache[jsonFilePath];

  return data;
}

/**
 * Make directories
 */
function makeDirs(dir: string) {
  const dirs = [dir];
  while (!fs.existsSync(dirs[0])) {
    dirs.unshift(path.dirname(dirs[0]));
  }
  dirs.shift();
  for (const dir of dirs) {
    fs.mkdirSync(dir);
  }
}

/**
 * JSON Schema to string
 */
function schemaStringify(schema: SchemaObject) {
  return JSON.stringify(schema, (_key, value) => {
    // if (key === "description" && typeof value === "string") {
    //     return undefined
    // }
    return value;
  });
}

/**
 * Resolve module path
 */
function resolvePath(modulePath: string | void, context: RuleContext) {
  if (!modulePath) {
    return undefined;
  }
  if (modulePath.startsWith(".")) {
    return path.join(getCwd(context), modulePath);
  }
  return modulePath;
}

/**
 * Get cwd
 */
function getCwd(context: RuleContext) {
  if (context.getCwd) {
    return context.getCwd();
  }
  return path.resolve("");
}
