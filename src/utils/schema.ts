import debugBuilder from "debug";
import fs from "fs";
import { draft7 as migrateToDraft7 } from "json-schema-migrate-x";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import type { RuleContext } from "../types.ts";
import { get, syncGet } from "./http-client/index.ts";
import type { SchemaObject } from "./types.ts";
import * as meta from "../meta.ts";

const debug = debugBuilder("eslint-plugin-json-schema-validator:utils-schema");

const TTL = 1000 * 60 * 60 * 24; // 1 day
const RELOADING = new Set<string>();

/**
 * Load schema data
 */
export function loadSchema(
  schemaPath: string,
  context: RuleContext,
): null | SchemaObject {
  return loadJsonInternal(schemaPath, context, (schema_) => {
    const schema = schema_ as SchemaObject;
    migrateToDraft7(schema);
    return schema;
  });
}
/**
 * Load json data
 */
export function loadJson<T>(jsonPath: string, context: RuleContext): null | T {
  return loadJsonInternal(jsonPath, context);
}

/**
 * Load json data. Can insert a data editing process.
 */
function loadJsonInternal<T>(
  jsonPath: string,
  context: RuleContext,
  edit?: (json: unknown) => T,
): null | T {
  if (jsonPath.startsWith("http://") || jsonPath.startsWith("https://")) {
    return loadJsonFromURL(normalizeSchemaUrl(jsonPath), context, edit);
  }
  if (jsonPath.startsWith("vscode://")) {
    let url = `https://raw.githubusercontent.com/ota-meshi/extract-vscode-schemas/main/resources/vscode/${jsonPath.slice(
      9,
    )}`;
    if (!url.endsWith(".json")) {
      url = `${url}.json`;
    }
    return loadJsonFromURL(url, context, (orig) => {
      const result = edit?.(orig) ?? (orig as T);
      if (jsonPath === "vscode://schemas/settings/machine") {
        // Adjust `vscode://schemas/settings/machine` resource to avoid bugs.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
        const target = (result as any)?.properties?.[
          "workbench.externalUriOpeners"
        ]?.additionalProperties?.anyOf;
        removeEmptyEnum(target);
      } else if (jsonPath === "vscode://schemas/launch") {
        // Adjust `vscode://schemas/launch` resource to avoid bugs.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
        const target = (result as any)?.properties?.compounds?.items?.properties
          ?.configurations?.items?.oneOf;
        removeEmptyEnum(target);
      }
      return result;
    });
  }
  const json = fs.readFileSync(path.resolve(context.cwd, jsonPath), "utf-8");
  const data = JSON.parse(json);
  return edit ? edit(data) : data;
}

/**
 * Normalize schema URL to use the official schemastore domain.
 */
function normalizeSchemaUrl(url: string): string {
  for (const prefix of [
    "https://json.schemastore.org/",
    "http://json.schemastore.org/",
  ]) {
    if (url.startsWith(prefix)) {
      return `https://www.schemastore.org/${url.slice(prefix.length)}`;
    }
  }
  return url;
}

/** remove empty `enum:` schema */
function removeEmptyEnum(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
  target: any,
) {
  if (!target) return;
  if (Array.isArray(target)) {
    for (const e of target) {
      removeEmptyEnum(e);
    }
    return;
  }
  if (Array.isArray(target.enum) && target.enum.length === 0) {
    delete target.enum;
    return;
  }
  if (
    target.type === "object" &&
    target.properties &&
    typeof target.properties === "object"
  ) {
    for (const key of Object.keys(target.properties)) {
      removeEmptyEnum(target.properties[key]);
    }
  }
}

/**
 * Load schema data from url
 */
function loadJsonFromURL<T>(
  jsonPath: string,
  context: RuleContext,
  edit?: (json: unknown) => T,
): null | T {
  let jsonFileName = jsonPath.replace(/^https?:\/\//u, "");
  if (!jsonFileName.endsWith(".json")) {
    jsonFileName = `${jsonFileName}.json`;
  }
  const jsonFilePath = path.join(
    dirname(fileURLToPath(import.meta.url)),
    `../../.cached_schemastore/${jsonFileName}`,
  );

  const options = context.settings?.["json-schema-validator"]?.http;

  const httpRequestOptions = options?.requestOptions ?? {};
  const httpGetModulePath = resolvePath(options?.getModulePath, context);

  fs.mkdirSync(path.dirname(jsonFilePath), { recursive: true });

  let data, timestamp;
  try {
    ({ data, timestamp } =
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports -- ignore
      require(`../../.cached_schemastore/${jsonFileName}`) as {
        data: SchemaObject;
        timestamp: number;
      });
  } catch {
    try {
      const jsonText = fs.readFileSync(jsonFilePath, "utf-8");
      ({ data, timestamp } = JSON.parse(jsonText) as {
        data: SchemaObject;
        timestamp: number;
      });
    } catch {
      // ignore
    }
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
  edit: ((json: unknown) => T) | undefined,
): T | null {
  let data: T;
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
      v: meta.version,
    }),
  );
  if (typeof require !== "undefined") delete require.cache[jsonFilePath];

  return data;
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
    return path.join(context.cwd, modulePath);
  }
  return modulePath;
}
