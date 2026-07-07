import type { ErrorObject } from "./ajv.ts";

/**
 * Reduce cascading `oneOf`/`anyOf` validation errors to the most specific set.
 *
 * - If every branch of a failed combining keyword produced the *same* errors,
 *   drop the umbrella error and return the deduplicated shared errors.
 * - Otherwise keep the umbrella error plus the single best-matching branch.
 * - Errors outside any combining keyword are returned unchanged.
 *
 * Pure function over ajv's raw error list; never fabricates new error objects.
 */
export function reduceErrors(errors: ErrorObject[]): ErrorObject[] {
  return resolve(errors);
}

/** `oneOf`/`anyOf` are the "umbrella" (combining) keywords we collapse. */
function isCombining(error: ErrorObject): boolean {
  return error.keyword === "oneOf" || error.keyword === "anyOf";
}

/** Whether `schemaPath` is a branch (descendant) of the umbrella at `umbrellaPath`. */
function isBranchOf(schemaPath: string, umbrellaPath: string): boolean {
  return schemaPath.startsWith(`${umbrellaPath}/`);
}

/** The branch index for a branch error under `umbrellaPath` (e.g. "0", "1"). */
function branchIndexOf(schemaPath: string, umbrellaPath: string): string {
  return schemaPath.slice(`${umbrellaPath}/`.length).split("/")[0];
}

/** Stable identity of an error, independent of which branch produced it. */
function errorKey(error: ErrorObject): string {
  return JSON.stringify([error.instancePath, error.keyword, error.params]);
}

/** Depth (segment count) of the deepest instance path in a list. */
function maxDepth(errors: ErrorObject[]): number {
  return errors.reduce((max, e) => {
    const depth = e.instancePath ? e.instancePath.split("/").length : 0;
    return depth > max ? depth : max;
  }, 0);
}

/**
 * Resolve one level of `oneOf`/`anyOf` umbrellas within `errors`, recursing
 * into each branch via {@link decide} to resolve any nested umbrellas first.
 */
function resolve(errors: ErrorObject[]): ErrorObject[] {
  const umbrellas = errors.filter(isCombining);
  // Outermost = umbrellas not nested inside another umbrella in this list.
  const outermost = umbrellas.filter(
    (u) =>
      !umbrellas.some((o) => o !== u && isBranchOf(u.schemaPath, o.schemaPath)),
  );
  if (outermost.length === 0) {
    return errors;
  }

  const result: ErrorObject[] = [];
  for (const error of errors) {
    if (outermost.includes(error)) {
      const branchErrors = errors.filter(
        (e) => e !== error && isBranchOf(e.schemaPath, error.schemaPath),
      );
      result.push(...decide(error, branchErrors));
      continue;
    }
    // Skip errors that belong to any outermost umbrella (handled above).
    if (outermost.some((u) => isBranchOf(error.schemaPath, u.schemaPath))) {
      continue;
    }
    // Untouched error (not under any umbrella).
    result.push(error);
  }
  return result;
}

/**
 * Decide how to represent one umbrella error: drop it in favor of the shared
 * errors when every branch resolves to the same error set, otherwise keep the
 * umbrella plus the errors of the single best (deepest, then smallest,
 * lowest-index) branch.
 */
function decide(
  umbrella: ErrorObject,
  branchErrors: ErrorObject[],
): ErrorObject[] {
  // Group by branch index, then resolve nested umbrellas within each branch.
  const groups = new Map<string, ErrorObject[]>();
  for (const e of branchErrors) {
    const idx = branchIndexOf(e.schemaPath, umbrella.schemaPath);
    const list = groups.get(idx);
    if (list) list.push(e);
    else groups.set(idx, [e]);
  }
  const resolved = [...groups.entries()]
    .map(([idx, errs]) => ({ idx, errs: resolve(errs) }))
    .filter((g) => g.errs.length > 0);

  if (resolved.length === 0) {
    // No usable branch information; keep the umbrella alone.
    return [umbrella];
  }

  const keySets = resolved.map((g) => new Set(g.errs.map(errorKey)));
  const sharedKeys = [...keySets[0]].filter((k) =>
    keySets.every((s) => s.has(k)),
  );
  // Identical <=> no branch carries a key outside the shared set.
  const allIdentical = keySets.every((s) => s.size === sharedKeys.length);

  if (allIdentical) {
    const seen = new Set<string>();
    const deduped: ErrorObject[] = [];
    for (const e of resolved[0].errs) {
      const k = errorKey(e);
      if (!seen.has(k)) {
        seen.add(k);
        deduped.push(e);
      }
    }
    return deduped;
  }

  // Mismatch: keep the umbrella + the single best branch.
  const best = [...resolved].sort((a, b) => {
    const depthDiff = maxDepth(b.errs) - maxDepth(a.errs);
    if (depthDiff !== 0) return depthDiff;
    const countDiff = a.errs.length - b.errs.length;
    if (countDiff !== 0) return countDiff;
    return Number(a.idx) - Number(b.idx);
  })[0];
  return [umbrella, ...best.errs];
}
