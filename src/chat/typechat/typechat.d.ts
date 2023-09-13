import { Result } from "./result";
import { TypeChatLanguageModel } from "./model";
import { TypeChatJsonValidator } from "./validate";
/**
 * Represents an object that can translate natural language requests in JSON objects of the given type.
 */
export interface TypeChatJsonTranslator<T extends object> {
    /**
     * The associated `TypeChatLanguageModel`.
     */
    model: TypeChatLanguageModel;
    /**
     * The associated `TypeChatJsonValidator<T>`.
     */
    validator: TypeChatJsonValidator<T>;
    /**
     * A boolean indicating whether to attempt repairing JSON objects that fail to validate. The default is `true`,
     * but an application can set the property to `false` to disable repair attempts.
     */
    attemptRepair: boolean;
    /**
     * A boolean indicating whether to delete properties with null values from parsed JSON objects. Some language
     * models (e.g. gpt-3.5-turbo) have a tendency to assign null values to optional properties instead of omitting
     * them. The default for this property is `false`, but an application can set the property to `true` for schemas
     * that don't permit null values.
     */
    stripNulls: boolean;
    /**
     * Creates an AI language model prompt from the given request. This function is called by `completeAndValidate`
     * to obtain the prompt. An application can assign a new function to provide a different prompt.
     * @param request The natural language request.
     * @returns A prompt that combines the request with the schema and type name of the underlying validator.
     */
    createRequestPrompt(request: string): string;
    /**
     * Creates a repair prompt to append to an original prompt/response in order to repair a JSON object that
     * failed to validate. This function is called by `completeAndValidate` when `attemptRepair` is true and the
     * JSON object produced by the original prompt failed to validate. An application can assign a new function
     * to provide a different repair prompt.
     * @param validationError The error message returned by the validator.
     * @returns A repair prompt constructed from the error message.
     */
    createRepairPrompt(validationError: string): string;
    /**
     * Translates a natural language request into an object of type `T`. If the JSON object returned by
     * the language model fails to validate and the `attemptRepair` property is `true`, a second
     * attempt to translate the request will be made. The prompt for the second attempt will include the
     * diagnostics produced for the first attempt. This often helps produce a valid instance.
     * @param request The natural language request.
     * @returns A promise for the resulting object.
     */
    translate(request: string): Promise<Result<T>>;
}
/**
 * Creates an object that can translate natural language requests into JSON objects of the given type.
 * The specified type argument `T` must be the same type as `typeName` in the given `schema`. The function
 * creates a `TypeChatJsonValidator<T>` and stores it in the `validator` property of the returned instance.
 * @param model The language model to use for translating requests into JSON.
 * @param schema A string containing the TypeScript source code for the JSON schema.
 * @param typeName The name of the JSON target type in the schema.
 * @returns A `TypeChatJsonTranslator<T>` instance.
 */
export declare function createJsonTranslator<T extends object>(model: TypeChatLanguageModel, schema: string, typeName: string): TypeChatJsonTranslator<T>;
