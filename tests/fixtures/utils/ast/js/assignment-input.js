const a = 42
let b
let d
export default {
    c: (b = a),
    e: (d = b),
}
console.log(b)
console.log(d)
