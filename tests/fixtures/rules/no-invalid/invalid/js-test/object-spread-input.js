const a = {
    num: "foo",
    str: "foo",
}
const b = {
    str: 42,
}
export default {
    ...a,
    ...b,
}
