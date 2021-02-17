let one = 1
const obj = {
    foo: 1,
}
export default {
    "one++": one++,
    "++one": ++one,
    "one--": one--,
    "--one": --one,

    "obj.foo++": obj.foo++,
    "++obj.foo": ++obj.foo,
    "obj.foo--": obj.foo--,
    "--obj.foo": --obj.foo,
}
