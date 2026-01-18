import type { RuleContext, SourceCode } from "../types";
import type { Rule, SourceCode as ESLintSourceCode } from "eslint";

export function getSourceCode(context: RuleContext): SourceCode;
export function getSourceCode(context: Rule.RuleContext): ESLintSourceCode;
/**
 * Returns `context.sourceCode`.
 */
export function getSourceCode(
  context: RuleContext | Rule.RuleContext,
): SourceCode | ESLintSourceCode {
  // eslint-disable-next-line no-restricted-properties -- This is the helper function itself
  return context.sourceCode as never;
}

/**
 * Gets the value of `context.filename`.
 */
export function getFilename(context: RuleContext | Rule.RuleContext): string {
  // eslint-disable-next-line no-restricted-properties -- This is the helper function itself
  return context.filename;
}

/**
 * Gets the value of `context.cwd`.
 */
export function getCwd(context: RuleContext | Rule.RuleContext): string {
  // eslint-disable-next-line no-restricted-properties -- This is the helper function itself
  return context.cwd;
}
