import type {
    CodeKeywordDefinition,
    DefinedError,
    ErrorObject,
    SchemaObject,
    ValidateFunction,
} from "ajv"
import Ajv, { _, str } from "ajv"

export default Ajv
export { _, str }
export type {
    CodeKeywordDefinition,
    DefinedError,
    ErrorObject,
    SchemaObject,
    ValidateFunction,
}
