import assert from "assert";
import addFormats from "ajv-formats";
import {
  loadAjvFormats,
  type AddFormats,
} from "../../../src/utils/ajv-formats-loader.ts";
import { buildAjv, compile } from "../../../src/utils/validator-factory.ts";
import type { RuleContext } from "../../../src/types.ts";
import type { SchemaObject } from "../../../src/utils/ajv.ts";

const EMAIL_SCHEMA: SchemaObject = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
  },
};

/** Minimal fake context; compile only reads `options[0]?.validateFormats`. */
function fakeContext(validateFormats?: boolean): RuleContext {
  return {
    options: [validateFormats === undefined ? {} : { validateFormats }],
  } as unknown as RuleContext;
}

describe("validator-factory ajv-formats support", () => {
  describe("loadAjvFormats", () => {
    it("throws a helpful error when ajv-formats is not installed", () => {
      /** Simulate a missing `ajv-formats` module. */
      function absent(): never {
        const err = new Error("Cannot find module 'ajv-formats'") as Error & {
          code?: string;
        };
        err.code = "MODULE_NOT_FOUND";
        throw err;
      }

      assert.throws(
        () => loadAjvFormats(absent),
        /requires the 'ajv-formats' package/u,
      );
    });

    it("returns the addFormats function when present", () => {
      const stub = (() => undefined) as unknown as AddFormats;

      /** Simulate `ajv-formats` resolving successfully. */
      function fakeRequire(): AddFormats {
        return stub;
      }

      assert.strictEqual(loadAjvFormats(fakeRequire), stub);
    });
  });

  describe("buildAjv", () => {
    it("does NOT load ajv-formats when validateFormats is off", () => {
      let called = false;
      const loader = (() => {
        called = true;
        return (() => undefined) as unknown as AddFormats;
      }) as () => AddFormats;

      const instance = buildAjv(false, loader);
      const validate = instance.compile(EMAIL_SCHEMA);
      // format is ignored when off -> invalid email still passes
      assert.strictEqual(validate({ email: "not-an-email" }), true);
      assert.strictEqual(called, false);
    });

    it("validates formats when validateFormats is on", () => {
      const instance = buildAjv(
        true,
        () => addFormats as unknown as AddFormats,
      );
      const validate = instance.compile(EMAIL_SCHEMA);
      assert.strictEqual(validate({ email: "not-an-email" }), false);
      assert.strictEqual(validate({ email: "a@b.com" }), true);
    });
  });

  describe("compile", () => {
    it("reports a format error when validateFormats: true", () => {
      const validator = compile(EMAIL_SCHEMA, process.cwd(), fakeContext(true));
      const errors = validator({ email: "not-an-email" });
      assert.ok(
        errors.some((e) => e.message.includes('format "email"')),
        `expected a format error, got ${JSON.stringify(errors)}`,
      );
    });

    it("reports NO format error by default", () => {
      const validator = compile(EMAIL_SCHEMA, process.cwd(), fakeContext());
      const errors = validator({ email: "not-an-email" });
      assert.deepStrictEqual(errors, []);
    });
  });
});
