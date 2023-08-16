"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJsonTranslator = void 0;
const result_1 = require("./result");
const validate_1 = require("./validate");
/**
 * Creates an object that can translate natural language requests into JSON objects of the given type.
 * The specified type argument `T` must be the same type as `typeName` in the given `schema`. The function
 * creates a `TypeChatJsonValidator<T>` and stores it in the `validator` property of the returned instance.
 * @param model The language model to use for translating requests into JSON.
 * @param schema A string containing the TypeScript source code for the JSON schema.
 * @param typeName The name of the JSON target type in the schema.
 * @returns A `TypeChatJsonTranslator<T>` instance.
 */
function createJsonTranslator(model, schema, typeName) {
    const validator = (0, validate_1.createJsonValidator)(schema, typeName);
    const typeChat = {
        model,
        validator,
        attemptRepair: true,
        stripNulls: false,
        createRequestPrompt,
        createRepairPrompt,
        translate
    };
    return typeChat;
    function createRequestPrompt(request) {
        return `You are a service that translates user requests into JSON objects of type "${validator.typeName}" according to the following TypeScript definitions:\n` +
            `\`\`\`\n${validator.schema}\`\`\`\n` +
            `The following is a user request:\n` +
            `"""\n${request}\n"""\n` +
            `The following is the user request translated into a JSON object with 2 spaces of indentation and no properties with the value undefined:\n`;
    }
    function createRepairPrompt(validationError) {
        return `The JSON object is invalid for the following reason:\n` +
            `"""\n${validationError}\n"""\n` +
            `The following is a revised JSON object:\n`;
    }
    async function translate(request) {
        let prompt = typeChat.createRequestPrompt(request);
        let attemptRepair = typeChat.attemptRepair;
        while (true) {
            const response = await model.complete(prompt);
            if (!response.success) {
                return response;
            }
            const responseText = response.data;
            const startIndex = responseText.indexOf("{");
            const endIndex = responseText.lastIndexOf("}");
            if (!(startIndex >= 0 && endIndex > startIndex)) {
                return (0, result_1.error)(`Response is not JSON:\n${responseText}`);
            }
            const jsonText = responseText.slice(startIndex, endIndex + 1);
            const validation = validator.validate(jsonText);
            if (validation.success) {
                return validation;
            }
            if (!attemptRepair) {
                return (0, result_1.error)(`JSON validation failed: ${validation.message}\n${jsonText}`);
            }
            prompt += `${responseText}\n${typeChat.createRepairPrompt(validation.message)}`;
            attemptRepair = false;
        }
    }
}
exports.createJsonTranslator = createJsonTranslator;
