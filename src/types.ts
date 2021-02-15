/* eslint @typescript-eslint/naming-convention: off, @typescript-eslint/no-explicit-any: off -- for type */
import type { JSONSchema4 } from "json-schema"
import type { Rule } from "eslint"
import type { AST as JSON } from "jsonc-eslint-parser"
import type { AST as YAML } from "yaml-eslint-parser"
import type { AST as TOML } from "toml-eslint-parser"
import type { AST as ES } from "eslint"
import type { Comment as ESTreeComment } from "estree"
export interface RuleListener {
    [key: string]: ((node: never) => void) | undefined
}

export interface RuleModule {
    meta: RuleMetaData
    create(context: Rule.RuleContext): RuleListener
}

export interface RuleMetaData {
    docs: {
        description: string
        categories: "recommended"[] | null
        url: string
        ruleId: string
        ruleName: string
        replacedBy?: string[]
        default?: "error" | "warn"
    }
    messages: { [messageId: string]: string }
    fixable?: "code" | "whitespace"
    schema: JSONSchema4 | JSONSchema4[]
    deprecated?: boolean
    type: "problem" | "suggestion" | "layout"
}

export interface PartialRuleModule {
    meta: PartialRuleMetaData
    create(context: RuleContext, params: { customBlock: boolean }): RuleListener
}

export interface PartialRuleMetaData {
    docs: {
        description: string
        categories: "recommended"[] | null
        replacedBy?: string[]
        default?: "error" | "warn"
    }
    messages: { [messageId: string]: string }
    fixable?: "code" | "whitespace"
    schema: JSONSchema4 | JSONSchema4[]
    deprecated?: boolean
    type: "problem" | "suggestion" | "layout"
}

export type JsonSchemaValidatorSettings = {
    http?: {
        requestOptions?: any
        getModulePath?: string
    }
}

export interface RuleContext {
    id: string
    options: any[]
    settings: { "json-schema-validator"?: JsonSchemaValidatorSettings }
    parserPath: string
    parserServices: {
        isJSON?: true
        isYAML?: true
        isTOML?: true
    }
    getAncestors(): Node[]
    getFilename(): string
    getSourceCode(): SourceCode
    report(descriptor: ReportDescriptor): void
    // eslint@6 does not have this method.
    getCwd?: () => string
}

// eslint-disable-next-line @typescript-eslint/no-namespace -- for type
export declare namespace SourceCode {
    export function splitLines(text: string): string[]
}
export type Node = JSON.JSONNode | YAML.YAMLNode | TOML.TOMLNode
export type Token = ES.Token | YAML.Token | TOML.Token | Comment
export type Comment = ESTreeComment | YAML.Comment | TOML.Comment
export type NodeOrToken = Node | Token
export interface SourceCode {
    text: string
    ast: JSON.JSONProgram | YAML.YAMLProgram | TOML.TOMLProgram
    lines: string[]
    hasBOM: boolean
    parserServices: {
        isJSON?: true
        isYAML?: true
        isTOML?: true
    }
    visitorKeys: {
        [nodeType: string]: string[]
    }

    getText(
        node?: NodeOrToken,
        beforeCount?: number,
        afterCount?: number,
    ): string

    getLines(): string[]

    getAllComments(): Comment[]

    getComments(node: NodeOrToken): { leading: Comment[]; trailing: Comment[] }

    getNodeByRangeIndex(index: number): Node | null

    isSpaceBetweenTokens(first: Token, second: Token): boolean

    getLocFromIndex(index: number): JSON.Position

    getIndexFromLoc(loc: JSON.Position): number

    // Inherited methods from TokenStore
    // ---------------------------------

    getTokenByRangeStart(
        offset: number,
        options?: { includeComments?: boolean },
    ): Token | null

    getFirstToken(node: Node): Token
    getFirstToken(node: Node, options?: CursorWithSkipOptions): Token | null

    getFirstTokens(node: Node, options?: CursorWithCountOptions): Token[]

    getLastToken(node: Node): Token
    getLastToken(node: Node, options?: CursorWithSkipOptions): Token | null

    getLastTokens(node: Node, options?: CursorWithCountOptions): Token[]

    // getTokenBefore(node: NodeOrToken): Token | null
    getTokenBefore(
        node: NodeOrToken,
        options?: CursorWithSkipOptions,
    ): Token | null

    getTokensBefore(
        node: NodeOrToken,
        options?: CursorWithCountOptions,
    ): Token[]

    // getTokenAfter(node: NodeOrToken): Token | null
    getTokenAfter(
        node: NodeOrToken,
        options?: CursorWithSkipOptions,
    ): Token | null

    getTokensAfter(node: NodeOrToken, options?: CursorWithCountOptions): Token[]

    getFirstTokenBetween(
        left: NodeOrToken,
        right: NodeOrToken,
        options?: CursorWithSkipOptions,
    ): Token | null

    getFirstTokensBetween(
        left: NodeOrToken,
        right: NodeOrToken,
        options?: CursorWithCountOptions,
    ): Token[]

    getLastTokenBetween(
        left: NodeOrToken,
        right: NodeOrToken,
        options?: CursorWithSkipOptions,
    ): Token | null

    getLastTokensBetween(
        left: NodeOrToken,
        right: NodeOrToken,
        options?: CursorWithCountOptions,
    ): Token[]

    getTokensBetween(
        left: NodeOrToken,
        right: NodeOrToken,
        padding?: number | FilterPredicate | CursorWithCountOptions,
    ): Token[]

    getTokens(node: Node, beforeCount?: number, afterCount?: number): Token[]
    getTokens(
        node: Node,
        options: FilterPredicate | CursorWithCountOptions,
    ): Token[]

    commentsExistBetween(left: NodeOrToken, right: NodeOrToken): boolean

    getCommentsBefore(nodeOrToken: NodeOrToken): Comment[]

    getCommentsAfter(nodeOrToken: NodeOrToken): Comment[]

    getCommentsInside(node: Node): Comment[]
}

type FilterPredicate = (tokenOrComment: Token) => boolean

type CursorWithSkipOptions =
    | number
    | FilterPredicate
    | {
          includeComments?: boolean
          filter?: FilterPredicate
          skip?: number
      }

type CursorWithCountOptions =
    | number
    | FilterPredicate
    | {
          includeComments?: boolean
          filter?: FilterPredicate
          count?: number
      }

interface ReportDescriptorOptionsBase {
    data?: { [key: string]: string }

    fix?:
        | null
        | ((fixer: RuleFixer) => null | Fix | IterableIterator<Fix> | Fix[])
}

type SuggestionDescriptorMessage = { desc: string } | { messageId: string }
type SuggestionReportDescriptor = SuggestionDescriptorMessage &
    ReportDescriptorOptionsBase

interface ReportDescriptorOptions extends ReportDescriptorOptionsBase {
    suggest?: SuggestionReportDescriptor[] | null
}

type ReportDescriptor = ReportDescriptorMessage &
    ReportDescriptorLocation &
    ReportDescriptorOptions
type ReportDescriptorMessage = { message: string } | { messageId: string }
type ReportDescriptorLocation =
    | { node: NodeOrToken }
    | { loc: SourceLocation | { line: number; column: number } }

export interface RuleFixer {
    insertTextAfter(nodeOrToken: NodeOrToken, text: string): Fix

    insertTextAfterRange(range: [number, number], text: string): Fix

    insertTextBefore(nodeOrToken: NodeOrToken, text: string): Fix

    insertTextBeforeRange(range: [number, number], text: string): Fix

    remove(nodeOrToken: NodeOrToken): Fix

    removeRange(range: [number, number]): Fix

    replaceText(nodeOrToken: NodeOrToken, text: string): Fix

    replaceTextRange(range: [number, number], text: string): Fix
}

export interface Fix {
    range: [number, number]
    text: string
}

interface SourceLocation {
    start: JSON.Position
    end: JSON.Position
}
