export type SchemaObject = {
    $id?: string
    $schema?: string
    $async?: false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
    [x: string]: any
}
