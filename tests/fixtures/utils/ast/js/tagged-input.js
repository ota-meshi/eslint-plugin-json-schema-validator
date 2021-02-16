const v = 42

function t() {
    return ""
}

const u = String

let unknown

export default {
    a: `aaa${v}`,
    b: t`a\nb\nc${v}`,
    c: String.raw`a\nb\nc${v}`,
    d: u`a\nb\nc${v}`,
    e: u.raw`a\nb\nc${v}`,
    f: String.raw`a\nb\nc${unknown}`,
}
