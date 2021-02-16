const t = {
    foo: 1,
}
const f = 0
const n = null
let u
export default {
    "|| 1": t || f,
    "|| 2": f || t,
    "|| 3": u || t,
    "|| 4": t || u,

    "&& 1": t && f,
    "&& 2": f && t,
    "&& 3": u && f,
    "&& 4": f && u,

    "?? 1": t ?? f,
    "?? 2": f ?? t,
    "?? 3": u ?? n,
    "?? 4": n ?? u,
    "?? 5": n ?? f,
    "?? 6": f ?? n,
}
