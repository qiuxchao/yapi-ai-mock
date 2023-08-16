import { Result } from "./result";
import { TypeChatLanguageModel } from "./model";
import { TypeChatJsonTranslator } from "./typechat";
/**
 * A program consists of a sequence of function calls that are evaluated in order.
 */
export type Program = {
    "@steps": FunctionCall[];
};
/**
 * A function call specifices a function name and a list of argument expressions. Arguments may contain
 * nested function calls and result references.
 */
export type FunctionCall = {
    "@func": string;
    "@args"?: Expression[];
};
/**
 * An expression is a JSON value, a function call, or a reference to the result of a preceding expression.
 */
export type Expression = JsonValue | FunctionCall | ResultReference;
/**
 * A JSON value is a string, a number, a boolean, null, an object, or an array. Function calls and result
 * references can be nested in objects and arrays.
 */
export type JsonValue = string | number | boolean | null | {
    [x: string]: Expression;
} | Expression[];
/**
 * A result reference represents the value of an expression from a preceding step.
 */
export type ResultReference = {
    "@ref": number;
};
/**
 * Transforms a JSON program object into an equivalent TypeScript module suitable for type checking.
 * The generated module takes the form:
 *
 *   import { API } from "./schema";
 *   function program(api: API) {
 *     const step1 = api.someFunction1(...);
 *     const step2 = api.someFunction2(...);
 *     return api.someFunction3(...);
 *   }
 *
 * @param jsonObject A JSON program object.
 * @returns A `Success<string>` with the module source code or an `Error` explaining why the JSON object
 * couldn't be transformed.
 */
export declare function createModuleTextFromProgram(jsonObject: object): Result<string>;
/**
 * Evaluates a JSON program using a simple interpreter. Function calls in the program are passed to the `onCall`
 * callback function for validation and dispatch. Thus, unlike JavaScript's `eval`, access to external functionality
 * and resources is entirely controlled by the host application. Note that `onCall` is expected to return a `Promise`
 * such that function dispatch can be implemented asynchronously if desired.
 * @param program The JSON program to evaluate.
 * @param onCall A callback function for handling function calls in the program.
 * @returns A `Promise` with the value of the last expression in the program.
 */
export declare function evaluateJsonProgram(program: Program, onCall: (func: string, args: unknown[]) => Promise<unknown>): Promise<unknown>;
/**
 * Creates an object that can translate natural language requests into simple programs, represented as JSON, that compose
 * functions from a specified API. The resulting programs can be safely evaluated using the `evaluateJsonProgram`
 * function.
 * @param model The language model to use for translating requests into programs.
 * @param schema The TypeScript source code for the target API. The source code must export a type named `API`.
 * @returns A `TypeChatJsonTranslator<Program>` instance.
 */
export declare function createProgramTranslator(model: TypeChatLanguageModel, schema: string): TypeChatJsonTranslator<Program>;
