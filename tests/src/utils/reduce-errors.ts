import assert from "assert";
import Ajv from "ajv";
import type { ErrorObject } from "../../../src/utils/ajv.ts";
import { reduceErrors } from "../../../src/utils/reduce-errors.ts";

function errorsFor(schema: object, data: unknown): ErrorObject[] {
  const ajv = new Ajv({ allErrors: true, verbose: true, strict: false });
  const validate = ajv.compile(schema);
  validate(data);
  return validate.errors ?? [];
}

/** Project errors to a stable, comparable shape and sort them. */
function project(errors: ErrorObject[]) {
  return errors
    .map((e) => ({
      path: e.instancePath,
      keyword: e.keyword,
      params: e.params,
    }))
    .sort((a, b) =>
      `${a.path}|${a.keyword}|${JSON.stringify(a.params)}`.localeCompare(
        `${b.path}|${b.keyword}|${JSON.stringify(b.params)}`,
      ),
    );
}

describe("reduceErrors", () => {
  it("returns non-combining errors unchanged", () => {
    const errors = errorsFor(
      {
        type: "object",
        required: ["foo"],
        properties: { bar: { type: "number" } },
      },
      { bar: "x" },
    );
    // Two independent errors: required 'foo' and type of bar. No oneOf/anyOf.
    assert.deepStrictEqual(project(reduceErrors(errors)), project(errors));
  });

  it("collapses identical branch failures and drops the umbrella", () => {
    // Value is a string; both branches require an object -> identical `type` errors.
    const errors = errorsFor(
      {
        oneOf: [
          { type: "object", properties: { a: { type: "number" } } },
          { type: "object", properties: { b: { type: "number" } } },
        ],
      },
      "hello",
    );
    const reduced = reduceErrors(errors);
    assert.deepStrictEqual(project(reduced), [
      { path: "", keyword: "type", params: { type: "object" } },
    ]);
  });

  it("keeps umbrella + deepest branch when branches differ", () => {
    const errors = errorsFor(
      {
        type: "object",
        properties: {
          extends: {
            oneOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
        },
      },
      { extends: [42] },
    );
    assert.deepStrictEqual(project(reduceErrors(errors)), [
      { path: "/extends/0", keyword: "type", params: { type: "string" } },
      { path: "/extends", keyword: "oneOf", params: { passingSchemas: null } },
    ]);
  });

  it("preserves errors outside the umbrella", () => {
    const errors = errorsFor(
      {
        type: "object",
        required: ["foo"],
        properties: {
          extends: {
            oneOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
        },
      },
      { extends: [42] },
    );
    assert.deepStrictEqual(project(reduceErrors(errors)), [
      { path: "/extends/0", keyword: "type", params: { type: "string" } },
      { path: "/extends", keyword: "oneOf", params: { passingSchemas: null } },
      { path: "", keyword: "required", params: { missingProperty: "foo" } },
    ]);
  });

  it("breaks ties by lowest branch index (anyOf)", () => {
    const errors = errorsFor(
      {
        type: "object",
        properties: {
          val: { anyOf: [{ type: "string" }, { type: "number" }] },
        },
      },
      { val: true },
    );
    assert.deepStrictEqual(project(reduceErrors(errors)), [
      { path: "/val", keyword: "anyOf", params: {} },
      { path: "/val", keyword: "type", params: { type: "string" } },
    ]);
  });

  it("resolves nested oneOf inside a branch before the outer one", () => {
    // Outer oneOf: branch0 wants a string; branch1 wants an object whose `x`
    // is itself oneOf[boolean, number]. Data picks the object branch but `x`
    // is a string, so the inner oneOf fails specifically.
    const errors = errorsFor(
      {
        oneOf: [
          { type: "string" },
          {
            type: "object",
            properties: {
              x: { oneOf: [{ type: "boolean" }, { type: "number" }] },
            },
            required: ["x"],
          },
        ],
      },
      { x: "nope" },
    );
    const reduced = project(reduceErrors(errors));
    // Outer umbrella kept (object branch is deepest); inner umbrella kept with
    // its best branch; the outer string-branch error is dropped.
    assert.ok(
      reduced.some((e) => e.path === "" && e.keyword === "oneOf"),
      "outer umbrella kept",
    );
    assert.ok(
      reduced.some((e) => e.path === "/x" && e.keyword === "oneOf"),
      "inner umbrella kept",
    );
    assert.ok(
      reduced.some((e) => e.path === "/x" && e.keyword === "type"),
      "inner best-branch type error kept",
    );
    assert.ok(
      !reduced.some((e) => e.path === "" && e.keyword === "type"),
      "outer losing string-branch dropped",
    );
  });
});
