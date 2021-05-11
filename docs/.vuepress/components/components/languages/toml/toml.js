// eslint-disable-next-line node/no-unsupported-features/es-syntax -- build
export const language = {
    tokenPostfix: ".toml",
    brackets: [
        { token: "delimiter.bracket", open: "{", close: "}" },
        { token: "delimiter.square", open: "[", close: "]" },
    ],
    keywords: ["true", "false", "nan", "+nan", "-nan", "inf", "+inf", "-inf"],
    numberInteger: /0|[+-]?\d+[\d_]*/,
    numberFloat: /(?:0|[+-]?\d+[\d_]*)(?:\.\d+)?(?:e[+-]?[1-9]\d*)?/,
    numberOctal: /0o[0-7]+[0-7_]*/,
    numberHex: /0x[\dA-Fa-f]+[\dA-F_a-f]*/,
    numberBinary: /0b[01]+[01_]*/,
    numberDate:
        /\d{4}-\d{2}-\d{2}([ Tt]\d{2}:\d{2}:\d{2}(\.\d+)?(( ?[+-]\d{1,2}(:\d{2})?)|Z)?)?/,
    escapes: /\\["\\bfnrt]/,
    tokenizer: {
        root: [
            { include: "@whitespace" },
            { include: "@comment" },
            { include: "@inlineCollections" },
            // Key=Value pair
            [
                /(".*?"|'.*?'|.*?)([\t ]*)(=)(\s+|$)/,
                ["type", "white", "operators", "white"],
            ],
            { include: "@numbers" },
            { include: "@scalars" },
            // String nodes
            [
                /\S+$/,
                {
                    cases: {
                        "@keywords": "keyword",
                        "@default": "string",
                    },
                },
            ],
        ],
        // Inline Table
        object: [
            { include: "@whitespace" },
            { include: "@comment" },
            // termination
            [/\}/, "@brackets", "@pop"],
            // delimiter
            [/,/, "delimiter.comma"],
            // Key=Value delimiter
            [/[=]/, "operators"],
            // Key=Value key
            [/(?:".*?"|'.*?'|[^,[{]+?)(?=[=])/u, "type"],
            // Values
            { include: "@inlineCollections" },
            { include: "@scalars" },
            { include: "@numbers" },
            // Other value (keyword or string)
            [
                /[^\s,}]+/u,
                {
                    cases: {
                        "@keywords": "keyword",
                        "@default": "string",
                    },
                },
            ],
        ],
        // Array or Table
        array: [
            { include: "@whitespace" },
            { include: "@comment" },
            // termination
            [/\]/, "@brackets", "@pop"],
            // delimiter
            [/,/, "delimiter.comma"],
            // Table delimiter
            [/\./, "delimiter.comma"],
            // Values
            { include: "@inlineCollections" },
            { include: "@scalars" },
            { include: "@numbers" },
            // Other value (keyword or string)
            [
                /[^\s,.\]]+/,
                {
                    cases: {
                        "@keywords": "keyword",
                        "@default": "string",
                    },
                },
            ],
        ],
        whitespace: [[/[\t\n\r ]+/, "white"]],
        // Only line comments
        comment: [[/#.*$/, "comment"]],
        // Start collections
        inlineCollections: [
            [/\[/, "@brackets", "@array"],
            [/\{/, "@brackets", "@object"],
        ],
        // Start Scalars (quoted strings)
        scalars: [
            [/"([^"\\]|\\.)*$/, "string.invalid"],
            [/'([^'\\]|\\.)*$/, "string.invalid"],
            [/'''[^']*'''/, "string"],
            [/'[^']*'/, "string"],
            [/"""/, "string", "@mlDoubleQuotedString"],
            [/"/, "string", "@doubleQuotedString"],
        ],
        mlDoubleQuotedString: [
            [/[^"\\]+/, "string"],
            [/@escapes/, "string.escape"],
            [/\\./, "string.escape.invalid"],
            [/"""/, "string", "@pop"],
        ],
        doubleQuotedString: [
            [/[^"\\]+/, "string"],
            [/@escapes/, "string.escape"],
            [/\\./, "string.escape.invalid"],
            [/"/, "string", "@pop"],
        ],
        // Numbers
        numbers: [
            [/@numberInteger(?=[\t ]*[#,\]}])/u, "number"],
            [/@numberFloat(?=[\t ]*[#,\]}])/u, "number.float"],
            [/@numberOctal(?=[\t ]*[#,\]}])/u, "number.octal"],
            [/@numberBinary(?=[\t ]*[#,\]}])/u, "number.binary"],
            [/@numberHex(?=[\t ]*[#,\]}])/u, "number.hex"],
            [/@numberDate(?=[\t ]*[#,\]}])/u, "number.date"],
            [/@numberInteger(?![\t ]*\S+)/, "number"],
            [/@numberFloat(?![\t ]*\S+)/, "number.float"],
            [/@numberBinary(?![\t ]*\S+)/u, "number.binary"],
            [/@numberOctal(?![\t ]*\S+)/, "number.octal"],
            [/@numberHex(?![\t ]*\S+)/, "number.hex"],
            [/@numberDate(?![\t ]*\S+)/, "number.date"],
        ],
    },
}
