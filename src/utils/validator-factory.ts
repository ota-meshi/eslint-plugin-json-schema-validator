import { draft7 as migrateToDraft7 } from "@unts/json-schema-migrate";

import type { RuleContext } from "../types";
import type {
  DefinedError,
  ErrorObject,
  RegExpEngine,
  SchemaObject,
  ValidateFunction,
} from "./ajv";
import Ajv from "./ajv";
import { loadSchema } from "./schema";

// eslint-disable-next-line func-style -- ignore
const lazyRegExpEngine: RegExpEngine = (str, flags) => {
  let error: Error;
  try {
    return new RegExp(str, flags);
  } catch (e) {
    error = e as never;
  }
  if (flags.includes("u")) {
    return new RegExp(str, flags.replace("u", ""));
  }
  throw error;
};
lazyRegExpEngine.code = "new RegExp";

const ajv = new Ajv({
  // schemaId: "auto",
  allErrors: true,
  verbose: true,
  validateSchema: false,
  // missingRefs: "ignore",
  // extendRefs: "ignore",
  logger: false,
  strict: false,
  code: {
    regExp: lazyRegExpEngine,
  },
});
// ajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-04.json"))
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports -- ignore
ajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-06.json"));

/** @see https://github.com/ajv-validator/ajv/blob/e816cd24b60068b3937dc7143beeab3fe6612391/lib/compile/util.ts#L59 */
function unescapeFragment(str: string): string {
  return unescapeJsonPointer(decodeURIComponent(str));
}

/** @see https://github.com/ajv-validator/ajv/blob/e816cd24b60068b3937dc7143beeab3fe6612391/lib/compile/util.ts#L72 */
function unescapeJsonPointer(str: string): string {
  return str.replace(/~1/g, "/").replace(/~0/g, "~");
}

export type Validator = (data: unknown) => ValidateError[];
export type ValidateError = { message: string; path: string[] };

/**
 * Compile JSON Schema
 */
export function compile(
  schema: SchemaObject,
  schemaPath: string,
  context: RuleContext,
): Validator {
  return schemaToValidator(schema, schemaPath, context);
}

/**
 * Build validator
 */
function schemaToValidator(
  schema: SchemaObject,
  schemaPath: string,
  context: RuleContext,
): Validator {
  let validateSchema: ValidateFunction;

  let schemaObject = schema;
  while (true) {
    try {
      if (
        typeof schemaObject.$id === "string" &&
        ajv.getSchema(schemaObject.$id.replace(/#$/u, ""))
      ) {
        ajv.removeSchema(schemaObject.$id.replace(/#$/u, ""));
      }
      validateSchema = ajv.compile(schemaObject);
    } catch (e) {
      if (
        ((e as Error).message ===
          'NOT SUPPORTED: keyword "id", use "$id" for schema ID' ||
          /exclusive(?:Maximum|Minimum) value must be .*"number".*/u.test(
            (e as Error).message,
          )) &&
        schema === schemaObject
      ) {
        schemaObject = JSON.parse(JSON.stringify(schemaObject));
        migrateToDraft7(schemaObject);
        continue;
      }
      if (resolveError(e, schemaPath, schemaObject, context)) {
        continue;
      }
      // eslint-disable-next-line no-console -- log
      console.error(schemaPath);
      throw e;
    }
    break;
  }

  return (data) => {
    if (validateSchema(data)) {
      return [];
    }

    return validateSchema.errors!.map(errorToValidateError);
  };
}

/**
 * Resolve Schema Error
 */
function resolveError(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
  error: any,
  baseSchemaPath: string,
  baseSchema: SchemaObject,
  context: RuleContext,
): boolean {
  if (error.missingRef) {
    let schemaPath = "";
    let schemaId = "";
    if (
      error.missingRef.startsWith("http://") ||
      error.missingRef.startsWith("https://") ||
      error.missingRef.startsWith("vscode://")
    ) {
      const uri = new URL(error.missingRef);
      uri.hash = "";
      schemaPath = uri.toString();
      schemaId = schemaPath;
    } else {
      const ref = error.missingRef;
      const baseUri = new URL(baseSchema.$id || baseSchemaPath);
      baseUri.hash = "";
      const slashIndex = baseUri.pathname.lastIndexOf("/");
      if (slashIndex >= 0) {
        baseUri.pathname = baseUri.pathname.slice(0, slashIndex + 1);
      }
      const uri = new URL(`${baseUri.toString()}${ref}`);
      uri.hash = "";
      schemaPath = uri.toString();
      schemaId = ref.split("#")[0];
    }
    if (schemaPath) {
      const refSchema = loadSchema(schemaPath, context);

      if (refSchema) {
        while (true) {
          try {
            ajv.addSchema(refSchema, schemaId);
          } catch (e) {
            if (resolveError(e, schemaPath, refSchema, context)) {
              continue;
            }
            throw e;
          }
          break;
        }
        return true;
      }
    }
  }

  return false;
}

/* eslint-disable complexity -- X( */
/**
 * Schema error to validate error.
 */
function errorToValidateError(
  /* eslint-enable complexity -- X( */
  errorObject: ErrorObject,
): ValidateError {
  const error: DefinedError = errorObject as DefinedError;

  const instancePath = error.instancePath.startsWith("/")
    ? error.instancePath.slice(1)
    : error.instancePath;
  // console.log(instancePath)
  const path: string[] = instancePath
    ? instancePath.split("/").map(unescapeFragment)
    : [];

  if (error.keyword === "additionalProperties") {
    path.push(error.params.additionalProperty);
    return {
      message: `Unexpected property ${joinPath(path)}`,
      path,
    };
  }
  if (error.keyword === "propertyNames") {
    return {
      message: `${joinPath(path)} property name ${JSON.stringify(
        error.params.propertyName,
      )} is invalid.`,
      path: [...path, error.params.propertyName],
    };
  }
  if (error.keyword === "uniqueItems") {
    const baseMessage = `must NOT have duplicate items (items ## ${error.params.j} and ${error.params.i} are identical)`;
    return {
      message: `${joinPath(path)} ${baseMessage}.`,
      path: [...path, String(error.params.i)],
    };
  }
  let baseMessage: string;
  if (error.keyword === "enum") {
    baseMessage = `must be equal to ${joinEnums(error.params.allowedValues)}`;
  } else if (error.keyword === "const") {
    baseMessage = `must be equal to ${JSON.stringify(
      error.params.allowedValue,
    )}`;
  } else if (error.keyword === "not") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
    const schema: any = error.schema!;
    const schemaKeys = Object.keys(schema);
    if (schemaKeys.length === 1 && schemaKeys[0] === "type") {
      // { type: "foo" }
      baseMessage = `must NOT be ${schema.type}`;
    } else if (schemaKeys.length === 1 && schemaKeys[0] === "enum") {
      // { enum: ["foo"] }
      baseMessage = `must NOT be equal to ${joinEnums(schema.enum)}`;
    } else {
      baseMessage = `must NOT be valid of define schema`;
    }
  } else if (
    error.keyword === "type" || // must be X
    error.keyword === "oneOf" || // must match exactly one schema in oneOf
    error.keyword === "anyOf" || // must match some schema in anyOf
    // array
    error.keyword === "minItems" || // must NOT have fewer than X items
    error.keyword === "maxItems" || // must NOT have more than X items
    error.keyword === "additionalItems" || // must NOT have more than X items
    error.keyword === "contains" || // must contain at least 1 valid item(s)
    // object
    error.keyword === "required" || // must have required property 'X'
    error.keyword === "maxProperties" || // must NOT have more than X items
    error.keyword === "minProperties" || // must NOT have fewer than X items
    error.keyword === "dependencies" || // must have property X when property Y is present
    // string
    error.keyword === "pattern" || // must match pattern "X"
    error.keyword === "maxLength" || // must NOT have more than X characters
    error.keyword === "minLength" || // must NOT have fewer than X characters
    error.keyword === "format" ||
    // number
    error.keyword === "maximum" || // must be <= X
    error.keyword === "minimum" || // must be >= X
    error.keyword === "exclusiveMaximum" || // must be < X
    error.keyword === "exclusiveMinimum" || // must be > X
    error.keyword === "multipleOf" || // must be multiple of X
    // other
    error.keyword === "if" // must match "X" schema
  ) {
    // Use error.message
    baseMessage = error.message!;
  } else {
    // Others
    baseMessage = error.message!;
  }

  if (error.propertyName) {
    return {
      message: `${joinPath(path)} property name ${JSON.stringify(
        error.propertyName,
      )} ${baseMessage}.`,
      path: [...path, error.propertyName],
    };
  }
  return {
    message: `${joinPath(path)} ${baseMessage}.`,
    path,
  };

  /** Join enums */
  function joinEnums(enums: string[]) {
    const list = enums.map((v: string) => JSON.stringify(v));
    const last = list.pop();
    if (list.length) {
      return `${list.join(", ")} or ${last}`;
    }
    return last;
  }

  /** Join paths */
  function joinPath(paths: string[]) {
    if (!paths.length) {
      return "Root";
    }
    let result = "";
    for (const p of paths) {
      if (/^[$a-z_][\w$]*$/iu.test(p)) {
        if (result) {
          result += `.${p}`;
        } else {
          result = p;
        }
      } else {
        result += `[${/^\d+$/u.test(p) ? p : JSON.stringify(p)}]`;
      }
    }
    return `"${result}"`;
  }
}
