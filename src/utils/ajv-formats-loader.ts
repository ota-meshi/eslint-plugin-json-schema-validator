import { createRequire } from "module";

const require = createRequire(import.meta.url);

/** Signature of ajv-formats' default export. */
export type AddFormats = (ajv: unknown, ...args: unknown[]) => unknown;

/** Module loader, injectable so tests can simulate a missing package. */
export type RequireFn = (
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
) => any;

/**
 * Lazily load the optional `ajv-formats` package.
 * Throws a helpful error if it is not installed.
 */
export function loadAjvFormats(requireFn: RequireFn = require): AddFormats {
  let mod;
  try {
    mod = requireFn("ajv-formats");
  } catch (e) {
    if ((e as { code?: string }).code === "MODULE_NOT_FOUND") {
      throw new Error(
        "The 'validateFormats' option requires the 'ajv-formats' package. Please install it by running: npm install ajv-formats",
      );
    }
    throw e;
  }
  // Handle both ESM interop (`.default`) and CJS default export shapes.
  return (mod.default ?? mod) as AddFormats;
}
