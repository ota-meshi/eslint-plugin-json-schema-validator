const t = {
    foo: 1,
}
const f = 0
let u
export default {
    a: t ? 42 : u,
    b: f ? u : 42,
    c: u ? t : f,
}
