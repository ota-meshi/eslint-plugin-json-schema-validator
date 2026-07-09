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

  it("keeps the oneOf umbrella when multiple schemas pass (multi-match)", () => {
    // Data matches BOTH branches, so ajv emits only the `oneOf` umbrella
    // (passingSchemas: [0, 1]) with no branch errors. There is nothing to
    // collapse into, so the "must match exactly one schema" cause survives.
    const errors = errorsFor(
      {
        oneOf: [
          { type: "object", properties: { a: { type: "number" } } },
          { type: "object", properties: { b: { type: "number" } } },
        ],
      },
      { a: 1, b: 2 },
    );
    assert.deepStrictEqual(project(reduceErrors(errors)), [
      { path: "", keyword: "oneOf", params: { passingSchemas: [0, 1] } },
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

  it("keeps the umbrella alone when no branch produced descendant errors", () => {
    // Both branches pass, so ajv only emits the oneOf umbrella error
    // (no per-branch descendant errors exist to reduce).
    const errors = errorsFor(
      { oneOf: [{ type: "object" }, { type: "object" }] },
      { a: 1 },
    );
    assert.deepStrictEqual(project(reduceErrors(errors)), project(errors));
    assert.deepStrictEqual(project(errors), [
      {
        path: "",
        keyword: "oneOf",
        params: { passingSchemas: [0, 1] },
      },
    ]);
  });

  it("handles 3+ branches (two identical + one differing)", () => {
    const errors = errorsFor(
      {
        type: "object",
        properties: {
          v: {
            anyOf: [
              { type: "number" },
              { type: "number" },
              { type: "boolean" },
            ],
          },
        },
      },
      { v: "str" },
    );
    assert.deepStrictEqual(project(reduceErrors(errors)), [
      { path: "/v", keyword: "anyOf", params: {} },
      { path: "/v", keyword: "type", params: { type: "number" } },
    ]);
  });

  it("collapses 3 identical branch failures and drops the umbrella", () => {
    const errors = errorsFor(
      { anyOf: [{ type: "number" }, { type: "number" }, { type: "number" }] },
      "str",
    );
    assert.deepStrictEqual(project(reduceErrors(errors)), [
      { path: "", keyword: "type", params: { type: "number" } },
    ]);
  });

  it("keeps umbrella + best branch when branches share some but not all errors", () => {
    // Typo shape (the issue's motivating case): every branch reports the same
    // `additionalProperties` error, but each also has a branch-specific `required`.
    // Because the branches are NOT identical, this must NOT collapse to the shared
    // error alone — it keeps the umbrella plus the single best branch (both branches
    // tie on depth and count, so the lowest index, the `run` branch, wins).
    const errors = errorsFor(
      {
        type: "object",
        oneOf: [
          {
            required: ["run"],
            properties: { run: {}, name: {} },
            additionalProperties: false,
          },
          {
            required: ["uses"],
            properties: { uses: {}, name: {} },
            additionalProperties: false,
          },
        ],
      },
      { name: "t", runn: "echo" },
    );
    assert.deepStrictEqual(project(reduceErrors(errors)), [
      {
        path: "",
        keyword: "additionalProperties",
        params: { additionalProperty: "runn" },
      },
      { path: "", keyword: "oneOf", params: { passingSchemas: null } },
      { path: "", keyword: "required", params: { missingProperty: "run" } },
    ]);
  });

  it("reduces sibling umbrellas independently (neither nested in the other)", () => {
    const errors = errorsFor(
      {
        type: "object",
        properties: {
          a: {
            oneOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
          b: { anyOf: [{ type: "boolean" }, { type: "number" }] },
        },
      },
      { a: [42], b: "x" },
    );
    // `/a` keeps umbrella + deepest branch (`/a/0`); `/b` keeps umbrella + lowest-index
    // branch (boolean). The two umbrellas are peers, reduced independently.
    assert.deepStrictEqual(project(reduceErrors(errors)), [
      { path: "/a/0", keyword: "type", params: { type: "string" } },
      { path: "/a", keyword: "oneOf", params: { passingSchemas: null } },
      { path: "/b", keyword: "anyOf", params: {} },
      { path: "/b", keyword: "type", params: { type: "boolean" } },
    ]);
  });

  it("keeps every error of the winning branch (multi-error branch)", () => {
    const errors = errorsFor(
      {
        oneOf: [
          { type: "string" },
          {
            type: "object",
            required: ["p", "q"],
            properties: { p: { type: "number" }, q: { type: "number" } },
          },
        ],
      },
      { p: "x" },
    );
    // The object branch is deepest, so it wins; BOTH of its errors survive
    // (`/p` type mismatch and the missing `q`), not just one.
    assert.deepStrictEqual(project(reduceErrors(errors)), [
      { path: "/p", keyword: "type", params: { type: "number" } },
      { path: "", keyword: "oneOf", params: { passingSchemas: null } },
      { path: "", keyword: "required", params: { missingProperty: "q" } },
    ]);
  });

  it("resolves three levels of nested oneOf innermost-first", () => {
    const errors = errorsFor(
      {
        oneOf: [
          { type: "string" },
          {
            type: "object",
            required: ["x"],
            properties: {
              x: {
                oneOf: [
                  { type: "boolean" },
                  {
                    type: "object",
                    required: ["y"],
                    properties: {
                      y: { oneOf: [{ type: "integer" }, { type: "string" }] },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      { x: { y: true } },
    );
    // At each level the umbrella + its deepest branch survive; every losing branch
    // (string at root, boolean at `/x`, string at `/x/y`) is dropped.
    assert.deepStrictEqual(project(reduceErrors(errors)), [
      { path: "/x/y", keyword: "oneOf", params: { passingSchemas: null } },
      { path: "/x/y", keyword: "type", params: { type: "integer" } },
      { path: "/x", keyword: "oneOf", params: { passingSchemas: null } },
      { path: "", keyword: "oneOf", params: { passingSchemas: null } },
    ]);
  });

  it("handles sibling umbrellas where one collapses and one keeps its best branch", () => {
    const errors = errorsFor(
      {
        type: "object",
        properties: {
          a: { oneOf: [{ type: "object" }, { type: "object" }] },
          b: {
            oneOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
        },
      },
      { a: "s", b: [42] },
    );
    // `/a` branches are identical -> collapse, umbrella dropped.
    // `/b` branches differ -> umbrella + deepest branch kept.
    assert.deepStrictEqual(project(reduceErrors(errors)), [
      { path: "/a", keyword: "type", params: { type: "object" } },
      { path: "/b/0", keyword: "type", params: { type: "string" } },
      { path: "/b", keyword: "oneOf", params: { passingSchemas: null } },
    ]);
  });
});
