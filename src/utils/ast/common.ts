import type { SourceCode } from "../../types"
export type GetLoc = (sourceCode: SourceCode) => [number, number]
export type NodeData<N> =
    | { key: GetLoc; value: N | null }
    | { key?: undefined; value: N }
export type GetNodeFromPath<N> = (node: never, paths: string[]) => NodeData<N>
