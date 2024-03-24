export function existsSync(arg) {
  return arg === "/";
}
export function mkdirSync() {
  // noop
}
export default { existsSync, mkdirSync };
