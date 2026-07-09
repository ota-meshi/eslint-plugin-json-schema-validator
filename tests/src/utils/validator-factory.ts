import assert from "assert";
import { buildAjv, compile } from "../../../src/utils/validator-factory.ts";
import type { RuleContext } from "../../../src/types.ts";
import type { SchemaObject } from "../../../src/utils/ajv.ts";

const EMAIL_SCHEMA: SchemaObject = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
  },
};

/** Minimal fake context; compile only reads `options[0]`. */
function fakeContext(): RuleContext {
  return {
    options: [{}],
  } as unknown as RuleContext;
}

describe("validator-factory ajv-formats support", () => {
  describe("buildAjv", () => {
    it("validates formats", () => {
      const instance = buildAjv();
      const validate = instance.compile(EMAIL_SCHEMA);
      assert.strictEqual(validate({ email: "not-an-email" }), false);
      assert.strictEqual(validate({ email: "a@b.com" }), true);
    });
  });

  describe("compile", () => {
    it("reports a format error by default", () => {
      const validator = compile(EMAIL_SCHEMA, process.cwd(), fakeContext());
      const errors = validator({ email: "not-an-email" });
      assert.ok(
        errors.some((e) => e.message.includes('format "email"')),
        `expected a format error, got ${JSON.stringify(errors)}`,
      );
    });
  });
});
